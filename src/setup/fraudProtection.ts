import FraudProtection from '@libs/FraudProtection';

import CONFIG from '@src/CONFIG';

// Financies does not send device fingerprints to Expensify's fraud-protection provider.
if (!CONFIG.IS_FINANCIES_PREVIEW) {
    FraudProtection.init();
}
