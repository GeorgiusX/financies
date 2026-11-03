import {getAccountIDFromUID, getEditedFields} from '@libs/FinanciesBackend';

jest.mock('firebase/app', () => ({
    getApps: () => [],
    initializeApp: jest.fn(),
}));
jest.mock('firebase/auth', () => ({}));
jest.mock('firebase/firestore', () => ({}));

describe('Financies Firebase backend', () => {
    it('derives the same positive account ID for the same Firebase user', () => {
        // Given the upstream interface keys people by number while Firebase uses string UIDs.
        const uid = 'q7XyZ1aBcDeFgHiJkLmNoPqRsTu2';
        // When the account ID is derived twice.
        const first = getAccountIDFromUID(uid);
        const second = getAccountIDFromUID(uid);
        // Then it is stable across sessions and a valid positive ID.
        expect(first).toBe(second);
        expect(first).toBeGreaterThan(0);
        expect(getAccountIDFromUID('another-user')).not.toBe(first);
    });

    it('keeps only editable fields and stores amounts as positive minor units', () => {
        // Given an edit command whose amount arrives negative, as expense report amounts do.
        // When its fields are prepared for Firestore.
        const fields = getEditedFields({
            amount: -1250,
            merchant: 'Bakery',
            transactionID: '1',
            reportID: '2',
            policyID: 'x',
        });
        // Then routing IDs are not copied into the stored expense.
        expect(fields).toEqual({amount: 1250, merchant: 'Bakery'});
    });

    it('drops fractional amounts so only integer minor units are stored', () => {
        // Given an amount that is not in integer minor units.
        // When the edit is prepared.
        const fields = getEditedFields({amount: 12.5});
        // Then it is left out instead of being written with the wrong precision.
        expect(fields).toEqual({});
    });
});
