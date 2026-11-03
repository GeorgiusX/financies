/**
 * Answers Financies API commands with Firebase Authentication and Cloud Firestore, so the upstream interface reads
 * and writes the signed-in user's own expenses instead of calling Expensify's API.
 */
import CONFIG from '@src/CONFIG';
import CONST from '@src/CONST';
import type Response from '@src/types/onyx/Response';

import type {FirebaseApp} from 'firebase/app';
import type {User} from 'firebase/auth';
import type {OnyxKey} from 'react-native-onyx';

import {getApps, initializeApp} from 'firebase/app';
import {createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut} from 'firebase/auth';
import {collection, deleteDoc, doc, getDocs, getFirestore, serverTimestamp, setDoc, updateDoc} from 'firebase/firestore';

import type {FinanciesExpense} from './FinanciesPreview';

import {SIDE_EFFECT_REQUEST_COMMANDS, WRITE_COMMANDS} from './API/types';
import {buildFinanciesData, buildFinanciesReadResponse} from './FinanciesPreview';

/** Marks the Onyx session as backed by Firebase; the real credential stays inside the Firebase SDK. */
const FIREBASE_SESSION_TOKEN = 'financies-firebase';

const CREATE_COMMANDS = new Set<string>([WRITE_COMMANDS.REQUEST_MONEY, WRITE_COMMANDS.TRACK_EXPENSE]);
const UPDATE_COMMAND_PREFIX = 'UpdateMoneyRequest';
const EDITABLE_FIELDS = ['amount', 'currency', 'merchant', 'created', 'category', 'comment'] as const;

function getFirebaseApp(): FirebaseApp {
    return getApps().at(0) ?? initializeApp(CONFIG.FINANCIES.FIREBASE);
}

/** Derives a stable numeric account ID from the Firebase UID, because the upstream interface keys people by number. */
function getAccountIDFromUID(uid: string): number {
    let hash = 0;
    for (const character of uid) {
        hash = (hash * 31 + character.charCodeAt(0)) % 2147483647;
    }
    return hash || 1;
}

function getCurrentUser(): Promise<User | null> {
    const auth = getAuth(getFirebaseApp());
    return auth.authStateReady().then(() => auth.currentUser);
}

function getTransactionsCollection(uid: string) {
    return collection(getFirestore(getFirebaseApp()), 'users', uid, 'transactions');
}

function toExpense(transactionID: string, value: Record<string, unknown>): FinanciesExpense {
    return {
        transactionID,
        merchant: typeof value.merchant === 'string' ? value.merchant : '',
        category: typeof value.category === 'string' ? value.category : '',
        amount: typeof value.amount === 'number' ? value.amount : 0,
        currency: typeof value.currency === 'string' ? value.currency : CONST.CURRENCY.EUR,
        created: typeof value.created === 'string' ? value.created : '',
        comment: typeof value.comment === 'string' ? value.comment : '',
    };
}

/** Copies the editable fields a command sent, storing amounts as positive integer minor units. */
function getEditedFields(parameters: Record<string, unknown>): Record<string, string | number> {
    const fields: Record<string, string | number> = {};
    for (const field of EDITABLE_FIELDS) {
        const value = parameters[field];
        if (field === 'amount' && typeof value === 'number' && Number.isInteger(value)) {
            fields.amount = Math.abs(value);
        } else if (field !== 'amount' && typeof value === 'string') {
            fields[field] = value;
        }
    }
    return fields;
}

function getUnavailableResponse<TKey extends OnyxKey>(message: string): Response<TKey> {
    return {jsonCode: CONST.JSON_CODE.BAD_REQUEST, message};
}

async function readExpenses(user: User): Promise<FinanciesExpense[]> {
    const snapshot = await getDocs(getTransactionsCollection(user.uid));
    return snapshot.docs.map((transaction) => toExpense(transaction.id, transaction.data()));
}

async function getFinanciesBackendResponse<TKey extends OnyxKey>(command: string, parameters: Record<string, unknown>): Promise<Response<TKey>> {
    if (command === SIDE_EFFECT_REQUEST_COMMANDS.LOG_OUT) {
        await signOut(getAuth(getFirebaseApp()));
        return {jsonCode: CONST.JSON_CODE.SUCCESS};
    }
    const user = await getCurrentUser();
    if (!user) {
        return getUnavailableResponse('You are signed out. Sign in to Financies again.');
    }
    const transactionID = typeof parameters.transactionID === 'string' ? parameters.transactionID : '';
    try {
        if (CREATE_COMMANDS.has(command) && transactionID) {
            // The client-generated transaction ID is the document ID, so a retried request overwrites rather than duplicates.
            await setDoc(doc(getTransactionsCollection(user.uid), transactionID), {
                ...toExpense(transactionID, parameters),
                ...getEditedFields(parameters),
                createdAt: serverTimestamp(),
            });
            return {jsonCode: CONST.JSON_CODE.SUCCESS};
        }
        if (command.startsWith(UPDATE_COMMAND_PREFIX) && transactionID) {
            const fields = getEditedFields(parameters);
            if (Object.keys(fields).length > 0) {
                await updateDoc(doc(getTransactionsCollection(user.uid), transactionID), {...fields, updatedAt: serverTimestamp()});
            }
            return {jsonCode: CONST.JSON_CODE.SUCCESS};
        }
        if (command === WRITE_COMMANDS.DELETE_MONEY_REQUEST && transactionID) {
            await deleteDoc(doc(getTransactionsCollection(user.uid), transactionID));
            return {jsonCode: CONST.JSON_CODE.SUCCESS};
        }
        const expenses = await readExpenses(user);
        const email = user.email ?? '';
        const account = {
            accountID: getAccountIDFromUID(user.uid),
            email,
            displayName: user.displayName ?? email.split('@').at(0) ?? email,
        };
        return (
            buildFinanciesReadResponse<TKey>(command, parameters, buildFinanciesData(account, expenses, FIREBASE_SESSION_TOKEN), expenses) ??
            getUnavailableResponse('This action is not available in Financies yet.')
        );
    } catch (error) {
        // Firestore rejects writes that break the security rules (for example a non-integer amount); show that instead of hanging the request.
        return getUnavailableResponse(error instanceof Error ? error.message : 'Financies could not reach Firebase. Please try again.');
    }
}

/** Calls back with the signed-in Firebase account whenever one is restored or signs in. */
function subscribeToFinanciesSignIn(onSignIn: (session: {accountID: number; email: string; authToken: string}) => void) {
    onAuthStateChanged(getAuth(getFirebaseApp()), (user) => {
        if (!user) {
            return;
        }
        onSignIn({
            accountID: getAccountIDFromUID(user.uid),
            email: user.email ?? '',
            authToken: FIREBASE_SESSION_TOKEN,
        });
    });
}

function signInToFinancies(email: string, password: string, shouldCreateAccount: boolean): Promise<unknown> {
    const auth = getAuth(getFirebaseApp());
    return shouldCreateAccount ? createUserWithEmailAndPassword(auth, email, password) : signInWithEmailAndPassword(auth, email, password);
}

export {getAccountIDFromUID, getEditedFields, getFinanciesBackendResponse, signInToFinancies, subscribeToFinanciesSignIn};
