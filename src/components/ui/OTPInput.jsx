import React, { useRef, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const OTPInput = ({ length = 6, value = '', onChange, disabled = false, error = false, className }) => {
    const inputRefs = useRef([]);
    const [focused, setFocused] = useState(-1);

    const handleChange = (index, e) => {
        const val = e.target.value;
        if (!/^\d*$/.test(val)) return; // Only allow digits

        const newValue = value.split('');
        newValue[index] = val.slice(-1); // Take only last character
        const joined = newValue.join('').slice(0, length);
        onChange?.(joined);

        // Auto-focus next input
        if (val && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        onChange?.(pasted);
        const focusIndex = Math.min(pasted.length, length - 1);
        inputRefs.current[focusIndex]?.focus();
    };

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <div className="flex gap-2 justify-center">
                {Array.from({ length }).map((_, index) => (
                    <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={value[index] || ''}
                        onChange={(e) => handleChange(index, e)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        onFocus={() => setFocused(index)}
                        onBlur={() => setFocused(-1)}
                        disabled={disabled}
                        className={cn(
                            "w-12 h-14 text-center text-xl font-mono font-bold",
                            "bg-background border rounded-md",
                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                            "transition-all duration-150",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            error
                                ? "border-destructive text-destructive"
                                : focused === index
                                    ? "border-primary"
                                    : "border-input"
                        )}
                    />
                ))}
            </div>
        </div>
    );
};

export default OTPInput;
