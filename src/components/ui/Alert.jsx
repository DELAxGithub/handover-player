import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const variants = {
    error: {
        container: 'bg-error text-error-foreground border-error-foreground/20',
        icon: AlertCircle,
    },
    warning: {
        container: 'bg-warning text-warning-foreground border-warning-foreground/20',
        icon: AlertTriangle,
    },
    success: {
        container: 'bg-success text-success-foreground border-success-foreground/20',
        icon: CheckCircle,
    },
    info: {
        container: 'bg-muted text-muted-foreground border-muted-foreground/20',
        icon: Info,
    },
};

const Alert = forwardRef(({ className, variant = 'info', title, children, icon: CustomIcon, ...props }, ref) => {
    const config = variants[variant] || variants.info;
    const IconComponent = CustomIcon || config.icon;

    return (
        <div
            ref={ref}
            role="alert"
            className={cn(
                "relative w-full rounded-lg border p-4",
                config.container,
                className
            )}
            {...props}
        >
            <div className="flex gap-3">
                <IconComponent className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                    {title && (
                        <AlertTitle>{title}</AlertTitle>
                    )}
                    {children && (
                        <AlertDescription>{children}</AlertDescription>
                    )}
                </div>
            </div>
        </div>
    );
});
Alert.displayName = 'Alert';

const AlertTitle = forwardRef(({ className, children, ...props }, ref) => (
    <h5
        ref={ref}
        className={cn("font-semibold leading-tight tracking-tight", className)}
        {...props}
    >
        {children}
    </h5>
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = forwardRef(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-sm opacity-90", className)}
        {...props}
    >
        {children}
    </div>
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
