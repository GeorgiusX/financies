/**
 * Keeps the Onyx session in step with Firebase Authentication, so signing in to Financies opens the signed-in app.
 */
import {subscribeToFinanciesSignIn} from '@libs/FinanciesBackend';

import ONYXKEYS from '@src/ONYXKEYS';

import Onyx from 'react-native-onyx';

function initFinanciesSession() {
    subscribeToFinanciesSignIn((session) => {
        Onyx.merge(ONYXKEYS.SESSION, {...session, loading: false});
    });
}

export default initFinanciesSession;
