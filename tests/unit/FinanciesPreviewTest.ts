import {getFinanciesPreviewData, getFinanciesPreviewResponse} from '@libs/FinanciesPreview';

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
});
