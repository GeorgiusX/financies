/**
 * Email and password sign-in for Financies, which uses Firebase Authentication instead of Expensify's magic-code flow.
 */
import Button from '@components/Button';
import FormHelpMessage from '@components/FormHelpMessage';
import Text from '@components/Text';
import TextInput from '@components/TextInput';
import TextLink from '@components/TextLink';

import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';

import {signInToFinancies} from '@libs/FinanciesBackend';

import CONST from '@src/CONST';

import React, {useState} from 'react';
import {View} from 'react-native';

/** Firebase Authentication rejects shorter passwords. */
const MIN_PASSWORD_LENGTH = 6;

function FinanciesSignInForm() {
    const {translate} = useLocalize();
    const styles = useThemeStyles();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const submit = () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail || password.length < MIN_PASSWORD_LENGTH) {
            setErrorMessage(translate('financiesSignIn.invalidForm'));
            return;
        }
        setErrorMessage('');
        setIsLoading(true);
        // On success Firebase's auth listener writes the Onyx session, which swaps this page for the signed-in app.
        signInToFinancies(trimmedEmail, password, isCreatingAccount).catch((error: unknown) => {
            setIsLoading(false);
            setErrorMessage(error instanceof Error ? error.message : translate('financiesSignIn.invalidForm'));
        });
    };

    const toggleMode = () => {
        setIsCreatingAccount(!isCreatingAccount);
        setErrorMessage('');
    };

    return (
        <View style={[styles.flex1, styles.justifyContentCenter, styles.ph5, styles.w100, styles.mw100, styles.alignSelfCenter]}>
            <Text style={[styles.textHeadlineH1, styles.mb5]}>{translate('financiesSignIn.title')}</Text>
            <TextInput
                label={translate('financiesSignIn.email')}
                accessibilityLabel={translate('financiesSignIn.email')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                autoCompleteType="email"
                inputMode={CONST.INPUT_MODE.EMAIL}
                maxLength={CONST.LOGIN_CHARACTER_LIMIT}
            />
            <TextInput
                label={translate('financiesSignIn.password')}
                accessibilityLabel={translate('financiesSignIn.password')}
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={submit}
                secureTextEntry
                autoCompleteType={isCreatingAccount ? 'new-password' : 'password'}
                containerStyles={[styles.mt3]}
            />
            {!!errorMessage && (
                <FormHelpMessage
                    isError
                    message={errorMessage}
                    style={[styles.mt3]}
                />
            )}
            <Button
                variant={CONST.BUTTON_VARIANT.SUCCESS}
                size={CONST.BUTTON_SIZE.LARGE}
                isLoading={isLoading}
                onPress={submit}
                style={[styles.mt5]}
                sentryLabel={CONST.SENTRY_LABEL.SIGN_IN.FINANCIES_SUBMIT}
            >
                <Button.Text>{translate(isCreatingAccount ? 'financiesSignIn.createAccount' : 'financiesSignIn.signIn')}</Button.Text>
            </Button>
            <TextLink
                onPress={toggleMode}
                style={[styles.mt5, styles.textAlignCenter]}
            >
                {translate(isCreatingAccount ? 'financiesSignIn.switchToSignIn' : 'financiesSignIn.switchToCreateAccount')}
            </TextLink>
        </View>
    );
}

export default FinanciesSignInForm;
