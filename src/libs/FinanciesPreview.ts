/** Sample-only responses let the upstream interface run before Financies has its own backend, and the Onyx builders shared with the Firebase adapter. */
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {PersonalDetailsList} from '@src/types/onyx';
import type Response from '@src/types/onyx/Response';

import type {OnyxKey} from 'react-native-onyx';

import {buildPersonalDetailsUpdate} from './PersonalDetailsUtils';

const PREVIEW_ACCOUNT_ID = 900001;
const PREVIEW_POLICY_ID = 'financies-preview';
const PREVIEW_CHAT_ID = '900100';
const PREVIEW_REPORT_ID = '900101';
const PREVIEW_EMAIL = 'explorer@financies.example';
type FinanciesAccount = {
    accountID: number;
    email: string;
    displayName: string;
};

/** A stored expense in integer minor units; the amount is positive and is negated for expense reports. */
type FinanciesExpense = {
    transactionID: string;
    merchant: string;
    category: string;
    amount: number;
    currency: string;
    created: string;
    comment: string;
};

const PREVIEW_ACCOUNT: FinanciesAccount = {
    accountID: PREVIEW_ACCOUNT_ID,
    email: PREVIEW_EMAIL,
    displayName: 'Financies Explorer',
};
const previewExpenses = [
    ['Morning coffee', 'Dining', 450],
    ['Weekly groceries', 'Groceries', 6840],
    ['Train ticket', 'Transport', 1890],
    ['Cloud storage', 'Subscriptions', 299],
    ['Lunch with friends', 'Dining', 3250],
    ['Bookshop', 'Shopping', 2490],
    ['Gym membership', 'Health', 3900],
    ['Electricity', 'Utilities', 7250],
] as const;

function getPreviewExpenses(): FinanciesExpense[] {
    return previewExpenses.map(([merchant, category, amount], index) => ({
        transactionID: String(901000 + index),
        merchant,
        category,
        amount,
        currency: 'EUR',
        created: `2026-11-${String(1 + (index % 2)).padStart(2, '0')}`,
        comment: 'Fictional expense for the Financies interface preview.',
    }));
}

function getExpensesTotal(expenses: FinanciesExpense[]): number {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

/** Builds the Onyx state for one signed-in account, its workspace, and its expenses. */
function buildFinanciesData(account: FinanciesAccount, expenses: FinanciesExpense[], authToken: string): Record<string, unknown> {
    const {accountID, email, displayName} = account;
    const [firstName = displayName, ...lastNames] = displayName.split(' ');
    const personalDetailsList: PersonalDetailsList = {
        [accountID]: {
            accountID,
            login: email,
            displayName,
            firstName,
            lastName: lastNames.join(' '),
            avatar: '',
            localCurrencyCode: 'EUR',
            timezone: {selected: 'Europe/Madrid', automatic: false},
        },
    };
    const personalDetailsUpdate = buildPersonalDetailsUpdate(personalDetailsList);
    const data: Record<string, unknown> = {
        [ONYXKEYS.SESSION]: {accountID, email, authToken, loading: false},
        [ONYXKEYS.ACCOUNT]: {
            ...CONST.DEFAULT_ACCOUNT_DATA,
            validated: true,
            primaryLogin: email,
        },
        [personalDetailsUpdate.key]: personalDetailsUpdate.value,
        [ONYXKEYS.NVP_PREFERRED_LOCALE]: 'en',
        [ONYXKEYS.NVP_ACTIVE_POLICY_ID]: PREVIEW_POLICY_ID,
        [ONYXKEYS.NVP_INTRO_SELECTED]: {
            choice: CONST.ONBOARDING_CHOICES.PERSONAL_SPEND,
        },
        [ONYXKEYS.NVP_ONBOARDING]: {
            hasCompletedGuidedSetupFlow: true,
            signupQualifier: 'individual',
            selfTourViewed: true,
        },
        [ONYXKEYS.IS_LOADING_APP]: false,
        [ONYXKEYS.HAS_LOADED_APP]: true,
        [ONYXKEYS.IS_LOADING_REPORT_DATA]: false,
        [ONYXKEYS.RAM_ONLY_IS_CHECKING_PUBLIC_ROOM]: false,
        [ONYXKEYS.BETAS]: [],
        [ONYXKEYS.CURRENCY_LIST]: {
            EUR: {symbol: '€', name: 'Euro', decimals: 2},
            USD: {symbol: '$', name: 'US Dollar', decimals: 2},
        },
        [`${ONYXKEYS.COLLECTION.POLICY}${PREVIEW_POLICY_ID}`]: {
            id: PREVIEW_POLICY_ID,
            name: 'Financies · Sample workspace',
            type: CONST.POLICY.TYPE.TEAM,
            role: CONST.POLICY.ROLE.ADMIN,
            owner: email,
            ownerAccountID: accountID,
            outputCurrency: 'EUR',
            isPolicyExpenseChatEnabled: true,
            areCategoriesEnabled: true,
            areTagsEnabled: false,
            approvalMode: 'OPTIONAL',
            employeeList: {[email]: {email, role: 'admin'}},
        },
        [`${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${PREVIEW_POLICY_ID}`]: Object.fromEntries(
            expenses.filter((expense) => !!expense.category).map(({category}) => [category, {name: category, enabled: true}]),
        ),
        [`${ONYXKEYS.COLLECTION.REPORT}${PREVIEW_CHAT_ID}`]: {
            reportID: PREVIEW_CHAT_ID,
            type: CONST.REPORT.TYPE.CHAT,
            chatType: CONST.REPORT.CHAT_TYPE.POLICY_EXPENSE_CHAT,
            reportName: 'Financies · Sample workspace',
            policyID: PREVIEW_POLICY_ID,
            ownerAccountID: accountID,
            participants: {[accountID]: {notificationPreference: 'always'}},
            isOwnPolicyExpenseChat: true,
            hasOutstandingChildRequest: true,
            iouReportID: PREVIEW_REPORT_ID,
            lastReadTime: '2026-11-02 12:00:00',
        },
        [`${ONYXKEYS.COLLECTION.REPORT}${PREVIEW_REPORT_ID}`]: {
            reportID: PREVIEW_REPORT_ID,
            reportName: 'Everyday spending · Sample data',
            type: CONST.REPORT.TYPE.EXPENSE,
            policyID: PREVIEW_POLICY_ID,
            ownerAccountID: accountID,
            managerID: accountID,
            parentReportID: PREVIEW_CHAT_ID,
            currency: 'EUR',
            total: -getExpensesTotal(expenses),
            stateNum: CONST.REPORT.STATE_NUM.OPEN,
            statusNum: CONST.REPORT.STATUS_NUM.OPEN,
            chatReportID: PREVIEW_CHAT_ID,
        },
        [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}${PREVIEW_CHAT_ID}`]: {},
        [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}${PREVIEW_REPORT_ID}`]: {},
    };
    for (const {transactionID, merchant, category, amount, currency, created, comment} of expenses) {
        data[`${ONYXKEYS.COLLECTION.TRANSACTION}${transactionID}`] = {
            transactionID,
            reportID: PREVIEW_REPORT_ID,
            amount: -amount,
            currency,
            merchant,
            category,
            created,
            comment: {comment},
            reimbursable: false,
            billable: false,
            tag: '',
            status: 'posted',
            accountID,
        };
    }
    return data;
}

function getFinanciesPreviewData(): Record<string, unknown> {
    return buildFinanciesData(PREVIEW_ACCOUNT, getPreviewExpenses(), 'financies-sample-only');
}

/** Answers read commands from already-built Onyx state, or returns undefined when the command is not a read. */
function buildFinanciesReadResponse<TKey extends OnyxKey>(
    command: string,
    parameters: Record<string, unknown>,
    fixture: Record<string, unknown>,
    expenses: FinanciesExpense[],
): Response<TKey> | undefined {
    const onyxData: Array<{onyxMethod: string; key: string; value: unknown}> = [];
    const isRead = /^(Open|Get|Search|Reconnect|AuthenticatePusher|Log|SetDevice|UpdateTimezone)/.test(command);
    if (!isRead) {
        return undefined;
    }
    if (command === 'OpenApp' || command === 'ReconnectApp') {
        for (const [key, value] of Object.entries(fixture)) {
            onyxData.push({onyxMethod: 'set', key, value});
        }
    }
    if (command === 'Search') {
        let query: Record<string, unknown> = {};
        try {
            const parsed: unknown = JSON.parse(typeof parameters.jsonQuery === 'string' ? parameters.jsonQuery : '{}');
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                query = {...parsed};
            }
        } catch {
            return {
                jsonCode: 400,
                message: 'The preview could not read this search query.',
            };
        }
        const searchData = Object.fromEntries(Object.entries(fixture).filter(([key]) => /^(transactions_|report_|policy_|personalDetailsList)/.test(key)));
        onyxData.push({
            onyxMethod: 'set',
            key: `${ONYXKEYS.COLLECTION.SNAPSHOT}${typeof parameters.hash === 'number' || typeof parameters.hash === 'string' ? parameters.hash : ''}`,
            value: {
                data: searchData,
                search: {
                    ...query,
                    hash: parameters.hash,
                    offset: 0,
                    type: query.type ?? 'expense',
                    sortBy: query.sortBy ?? 'date',
                    sortOrder: query.sortOrder ?? 'desc',
                    isLoading: false,
                    state: 'loaded',
                    hasMoreResults: false,
                    hasResults: true,
                    count: expenses.length,
                    total: getExpensesTotal(expenses),
                    currency: 'EUR',
                },
            },
        });
    }
    // Fixture keys span several Onyx collections, while each caller's response type narrows to its own request keys.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The synthetic server boundary intentionally returns updates for multiple request key types.
    return {
        jsonCode: 200,
        onyxData,
        requestID: `financies-preview-${command}`,
    } as unknown as Response<TKey>;
}

function getFinanciesPreviewResponse<TKey extends OnyxKey>(command: string, parameters: Record<string, unknown>): Response<TKey> {
    const expenses = getPreviewExpenses();
    return (
        buildFinanciesReadResponse<TKey>(command, parameters, buildFinanciesData(PREVIEW_ACCOUNT, expenses, 'financies-sample-only'), expenses) ?? {
            jsonCode: 400,
            message: 'This is a sample-data preview. Saving and payments will be available after the Financies backend is connected.',
        }
    );
}

export {buildFinanciesData, buildFinanciesReadResponse, getFinanciesPreviewData, getFinanciesPreviewResponse};
export type {FinanciesAccount, FinanciesExpense};
