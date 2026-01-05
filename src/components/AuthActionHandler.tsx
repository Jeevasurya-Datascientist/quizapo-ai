import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { CheckCircle2, XCircle, Loader2, KeyRound, MailCheck } from 'lucide-react';

interface AuthActionHandlerProps {
    mode: string; // 'verifyEmail' | 'resetPassword' | 'recoverEmail'
    oobCode: string;
    onComplete: () => void; // Callback to go to login or dashboard
}

export const AuthActionHandler: React.FC<AuthActionHandlerProps> = ({ mode, oobCode, onComplete }) => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'input'>('loading');
    const [errorMsg, setErrorMsg] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [email, setEmail] = useState(""); // For password reset context

    useEffect(() => {
        handleAction();
    }, [mode, oobCode]);

    const handleAction = async () => {
        try {
            if (mode === 'verifyEmail') {
                await applyActionCode(auth, oobCode);
                // Attempt to auto-reload user if they are logged in on this device
                if (auth.currentUser) {
                    await auth.currentUser.reload();
                }
                setStatus('success');
            } else if (mode === 'resetPassword') {
                const userEmail = await verifyPasswordResetCode(auth, oobCode);
                setEmail(userEmail);
                setStatus('input'); // Show password reset form
            } else if (mode === 'recoverEmail') {
                // Handle email recovery if needed, usually less common for MVPs
                setErrorMsg("Email recovery not yet supported.");
                setStatus('error');
            }
        } catch (error: any) {
            console.error("Auth Action Error:", error);
            setStatus('error');
            setErrorMsg(getErrorMessage(error.code));
        }
    };

    const handlePasswordResetSubmit = async () => {
        if (!newPassword || newPassword.length < 6) {
            setErrorMsg("Password must be at least 6 characters.");
            return;
        }

        setStatus('loading');
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setStatus('success');
        } catch (error: any) {
            setStatus('error');
            setErrorMsg(getErrorMessage(error.code));
        }
    };

    const getErrorMessage = (code: string) => {
        switch (code) {
            case 'auth/invalid-action-code':
                return 'This link is invalid or has expired. Please request a new one.';
            case 'auth/user-disabled':
                return 'This user account has been disabled.';
            case 'auth/user-not-found':
                return 'User not found.';
            case 'auth/weak-password':
                return 'Password is too weak.';
            default:
                return 'An error occurred. Please try again.';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-indigo-600">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold flex flex-col items-center gap-2">
                        {status === 'loading' && <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />}
                        {status === 'success' && <CheckCircle2 className="w-10 h-10 text-emerald-500" />}
                        {status === 'error' && <XCircle className="w-10 h-10 text-red-500" />}
                        {status === 'input' && <KeyRound className="w-10 h-10 text-indigo-600" />}

                        <span>
                            {mode === 'verifyEmail' && "Email Verification"}
                            {mode === 'resetPassword' && "Reset Password"}
                        </span>
                    </CardTitle>
                    <CardDescription>
                        {mode === 'resetPassword' && status === 'input' && `Resetting password for ${email}`}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                    {/* LOADING STATE */}
                    {status === 'loading' && (
                        <p className="text-center text-slate-500">Processing your request...</p>
                    )}

                    {/* SUCCESS STATE */}
                    {status === 'success' && (
                        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                            <p className="text-slate-600 dark:text-slate-300">
                                {mode === 'verifyEmail'
                                    ? "Your email has been successfully verified! You can now access all features."
                                    : "Your password has been successfully reset. You can now login with your new credentials."}
                            </p>
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={onComplete}>
                                Continue to Dashboard
                            </Button>
                        </div>
                    )}

                    {/* ERROR STATE */}
                    {status === 'error' && (
                        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                            <p className="text-red-500 font-medium bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/20">
                                {errorMsg}
                            </p>
                            <Button variant="outline" className="w-full" onClick={onComplete}>
                                Return to Login
                            </Button>
                        </div>
                    )}

                    {/* INPUT STATE (Password Reset) */}
                    {status === 'input' && mode === 'resetPassword' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">New Password</label>
                                <Input
                                    type="password"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handlePasswordResetSubmit}>
                                Reset Password
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
