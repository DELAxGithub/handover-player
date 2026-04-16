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
        : 'Unknown';

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
                            Expired
                        </Badge>
                    </div>

                    <CardDescription className="mt-4 text-base">
                        The share link for this project has expired
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Info Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Expiration Date */}
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium">Expired on</span>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                                {formattedDate}
                            </p>
                        </div>

                        {/* Comment Count */}
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-xs font-medium">Comments</span>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                                {commentCount} archived
                            </p>
                        </div>
                    </div>

                    {/* Message */}
                    <p className="text-sm text-muted-foreground text-center px-4">
                        {isOwner
                            ? 'Extend access to share this project again.'
                            : 'Contact the project owner to request extended access.'
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
                                Extend Access
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Extension requires an additional fee
                            </p>
                        </>
                    ) : (
                        <>
                            <Button
                                onClick={onContactOwner}
                                className="w-full h-12 text-base font-bold"
                            >
                                Contact Owner
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => window.history.back()}
                                className="w-full text-muted-foreground"
                            >
                                Go Back
                            </Button>
                        </>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};

export default ExpiredLockScreen;
