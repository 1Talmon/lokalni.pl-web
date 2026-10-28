'use client';
import { useApp } from '../../../providers/AppProvider';
import { DeleteAccountConfirmView } from '../../../views/DeleteAccountConfirmView';

// The link from the confirmation e-mail carries a one-time token and the API confirms with it alone — no login.
// It's often opened in a browser where the user isn't signed in (deletion requested in the app, link opened from mail).
export default function DeleteAccountConfirmPage() {
    const { actions } = useApp();
    return <DeleteAccountConfirmView addToast={actions.addToast} />;
}
