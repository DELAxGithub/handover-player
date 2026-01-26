import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown, Check } from 'lucide-react';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Select = forwardRef(({
    className,
    label,
    value,
    onChange,
    options = [],
    placeholder = 'Select option',
    disabled = false,
    ...props
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange?.(optionValue);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={cn("flex flex-col gap-1.5", className)}>
            {label && (
                <label className="text-sm font-medium text-foreground">
                    {label}
                </label>
            )}
            <div className="relative">
                <button
                    ref={ref}
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-pill border border-input bg-background px-4 py-2 text-sm",
                        "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        isOpen && "ring-2 ring-ring ring-offset-2"
                    )}
                    {...props}
                >
                    <span className={cn(
                        selectedOption ? "text-foreground" : "text-muted-foreground"
                    )}>
                        {selectedOption?.label || placeholder}
                    </span>
                    <ChevronDown className={cn(
                        "h-4 w-4 opacity-50 transition-transform",
                        isOpen && "rotate-180"
                    )} />
                </button>

                {isOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg animate-in fade-in-0 zoom-in-95">
                        <div className="p-1 max-h-60 overflow-auto">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={cn(
                                        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none",
                                        "hover:bg-muted hover:text-accent-foreground",
                                        "focus:bg-muted focus:text-accent-foreground",
                                        value === option.value && "bg-muted"
                                    )}
                                >
                                    <span className="flex-1 text-left">{option.label}</span>
                                    {value === option.value && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});
Select.displayName = 'Select';

export default Select;
