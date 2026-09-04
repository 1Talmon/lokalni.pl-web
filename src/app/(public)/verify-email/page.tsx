'use client';
import { useApp } from '../../../providers/AppProvider';
import { VerifyEmailView } from '../../../views/VerifyEmailView';

export default function VerifyEmailPage() {
    const { actions } = useApp();
    return (
        <VerifyEmailView
            onLoginSuccess={actions.handleLoginSuccess}
            addToast={actions.addToast}
        />
    );
}
