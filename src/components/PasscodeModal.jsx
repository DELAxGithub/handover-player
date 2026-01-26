import React, { useState, useEffect } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import Button from './ui/Button';
import OTPInput from './ui/OTPInput';
import { Alert } from './ui/Alert';

const PasscodeModal = ({
    isOpen,
    onSubmit,
    onCancel,
    projectTitle = 'Protected Project',
    isLoading = false,
    error = null,
    maxAttempts = 5,
    lockoutDuration = 30, // seconds
}) => {
    const [passcode, setPasscode] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isLockedOut, setIsLockedOut] = useState(false);
    const [lockoutTimer, setLockoutTimer] = useState(0);

    // Lockout countdown
    useEffect(() => {
        let interval;
        if (isLockedOut && lockoutTimer > 0) {
            interval = setInterval(() => {
                setLockoutTimer((prev) => {
                    if (prev <= 1) {
                        setIsLockedOut(false);
                        setAttempts(0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isLockedOut, lockoutTimer]);

    // Handle error (increment attempts)
    useEffect(() => {
        if (error) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setPasscode('');

            if (newAttempts >= maxAttempts) {
                setIsLockedOut(true);
                setLockoutTimer(lockoutDuration);
            }
        }
    }, [error]);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setPasscode('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (passcode.length === 6 && !isLockedOut && !isLoading) {
            onSubmit?.(passcode);
        }
    };

    const canSubmit = passcode.length === 6 && !isLockedOut && !isLoading;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <Card className="w-full max-w-md bg-card border-border shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="text-xl font-bold">{projectTitle}</CardTitle>
                        <CardDescription>
                            このプロジェクトはパスコードで保護されています
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-4">
                        {/* Lockout Alert */}
                        {isLockedOut && (
                            <Alert variant="error" title="アクセス制限中">
                                試行回数が上限に達しました。{lockoutTimer}秒後に再試行できます。
                            </Alert>
                        )}

                        {/* Error Alert (not lockout) */}
                        {error && !isLockedOut && (
                            <Alert variant="error" title="パスコードが違います">
                                正しいパスコードを入力してください（残り{maxAttempts - attempts}回）
                            </Alert>
                        )}

                        {/* OTP Input */}
                        <div className="flex flex-col items-center gap-4">
                            <label className="text-sm font-medium text-muted-foreground">
                                6桁のパスコードを入力
                            </label>
                            <OTPInput
                                length={6}
                                value={passcode}
                                onChange={setPasscode}
                                disabled={isLockedOut || isLoading}
                                error={!!error && !isLockedOut}
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={!canSubmit}
                            className="w-full h-12 text-base font-bold"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    確認中...
                                </>
                            ) : (
                                'アクセスする'
                            )}
                        </Button>

                        {onCancel && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onCancel}
                                className="w-full text-muted-foreground"
                            >
                                キャンセル
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default PasscodeModal;
