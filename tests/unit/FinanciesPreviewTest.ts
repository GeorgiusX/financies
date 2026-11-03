import {buildSearchGroups, getFinanciesPreviewData, getFinanciesPreviewResponse} from '@libs/FinanciesPreview';

import ONYXKEYS from '@src/ONYXKEYS';

jest.mock('@libs/PersonalDetailsUtils', () => ({
    buildPersonalDetailsUpdate: (value: unknown) => ({onyxMethod: 'merge', key: 'personalDetailsList', value}),
}));

describe('Financies sample preview', () => {
    it('provides synthetic transactions and a sample session', () => {
        // Given the standalone preview has no real backend.
        const data = getFinanciesPreviewData();
        // When its bootstrap fixture is created.
        const transactions = Object.keys(data).filter((key) => key.startsWith(ONYXKEYS.COLLECTION.TRANSACTION));
        // Then the interface can be explored without real account credentials.
        expect(transactions).toHaveLength(8);
        expect(data[ONYXKEYS.SESSION]).toMatchObject({email: 'explorer@financies.example', authToken: 'financies-sample-only'});
    });

    it.each(['PayMoneyRequest', 'SendMoney', 'AddBankAccount', 'CreateWorkspace', 'UpdateMoneyRequest'])('rejects unsupported mutation %s', (command) => {
        // Given a request would normally change backend data or move money.
        // When it is made against the sample-only adapter.
        const response = getFinanciesPreviewResponse(command, {});
        // Then it reports unavailable instead of pretending the action succeeded.
        expect(response.jsonCode).toBe(400);
        expect(response.onyxData).toBeUndefined();
    });

    it('returns the requested search snapshot with a stable sample total', () => {
        // Given the ledger requests a particular search snapshot.
        // When it searches the sample expenses.
        const response = getFinanciesPreviewResponse('Search', {hash: 123, jsonQuery: '{"type":"expense"}'});
        // Then the upstream list can finish loading and render the synthetic rows.
        expect(response.onyxData?.[0]).toMatchObject({key: `${ONYXKEYS.COLLECTION.SNAPSHOT}123`, value: {search: {count: 8, total: 26369, isLoading: false}}});
    });

    it('reports invalid search JSON', () => {
        // Given an invalid search payload.
        // When the preview adapter reads it.
        const response = getFinanciesPreviewResponse('Search', {hash: 123, jsonQuery: '{'});
        // Then it produces an explicit error rather than hanging the request.
        expect(response.jsonCode).toBe(400);
    });

    it('totals expenses per category so spend charts have data', () => {
        // Given two dining expenses and one grocery expense.
        const expenses = [
            {transactionID: '1', merchant: 'Cafe', category: 'Dining', amount: 450, currency: 'EUR', created: '2026-11-02', comment: ''},
            {transactionID: '2', merchant: 'Bistro', category: 'Dining', amount: 550, currency: 'EUR', created: '2026-10-15', comment: ''},
            {transactionID: '3', merchant: 'Market', category: 'Groceries', amount: 3000, currency: 'EUR', created: '2026-11-01', comment: ''},
        ];
        // When they are grouped by category.
        const groups = buildSearchGroups('category', expenses, 1, 'EUR');
        // Then each category carries its count, total and share, like a Search API group.
        expect(groups.group_Dining).toEqual({category: 'Dining', count: 2, total: 1000, currency: 'EUR', percentOfTotal: 25});
        expect(groups.group_Groceries).toMatchObject({count: 1, total: 3000, percentOfTotal: 75});
    });

    it('groups expenses by calendar month', () => {
        // Given expenses in two different months.
        const expenses = [
            {transactionID: '1', merchant: 'A', category: '', amount: 100, currency: 'EUR', created: '2026-10-31', comment: ''},
            {transactionID: '2', merchant: 'B', category: '', amount: 200, currency: 'EUR', created: '2026-11-01', comment: ''},
        ];
        // When they are grouped by month.
        const groups = buildSearchGroups('month', expenses, 1, 'EUR');
        // Then each month is its own group, with months numbered 1 to 12 as the Search API does.
        expect(Object.values(groups)).toEqual(
            expect.arrayContaining([expect.objectContaining({year: 2026, month: 10, total: 100}), expect.objectContaining({year: 2026, month: 11, total: 200})]),
        );
    });
});
