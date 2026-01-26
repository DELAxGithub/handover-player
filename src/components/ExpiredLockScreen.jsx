import React from 'react';
import { Clock, MessageSquare, Unlock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';

const ExpiredLockScreen = ({
    projectTitle = 'Project',
    expiredAt,
    commentCount = 0,
    onExtendAccess,
    onContactOwner,
    isOwner = false,
}) => {
    const formattedDate = expiredAt
        ? new Date(expiredAt).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : '不明';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-lg bg-card border-border shadow-2xl">
                <CardHeader className="text-center pb-4">
                    {/* Expired Icon */}
                    <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-error/20 flex items-center justify-center">
                        <Clock className="w-10 h-10 text-error-foreground" />
                    </div>

                    {/* Project Title */}
                    <CardTitle className="text-2xl font-bold text-foreground">
                        {projectTitle}
                    </CardTitle>

                    {/* Expired Badge */}
                    <div className="flex justify-center mt-2">
                        <Badge variant="destructive" className="text-sm px-3 py-1">
                            期限切れ
                        </Badge>
                    </div>

                    <CardDescription className="mt-4 text-base">
                        このプロジェクトの共有リンクは有効期限が切れています
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Info Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Expiration Date */}
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium">有効期限</span>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                                {formattedDate}
                            </p>
                        </div>

                        {/* Comment Count */}
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-xs font-medium">コメント</span>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                                {commentCount}件 アーカイブ済み
                            </p>
                        </div>
                    </div>

                    {/* Message */}
                    <p className="text-sm text-muted-foreground text-center px-4">
                        {isOwner
                            ? 'アクセスを延長して、再度プロジェクトを共有できます。'
                            : 'プロジェクトオーナーに連絡して、アクセスの延長をリクエストしてください。'
                        }
                    </p>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                    {isOwner ? (
                        <>
                            <Button
                                onClick={onExtendAccess}
                                className="w-full h-12 text-base font-bold"
                            >
                                <Unlock className="w-5 h-5 mr-2" />
                                アクセスを延長
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                延長には追加料金が発生します
                            </p>
                        </>
                    ) : (
                        <>
                            <Button
                                onClick={onContactOwner}
                                className="w-full h-12 text-base font-bold"
                            >
                                オーナーに連絡
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => window.history.back()}
                                className="w-full text-muted-foreground"
                            >
                                戻る
                            </Button>
                        </>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};

export default ExpiredLockScreen;
