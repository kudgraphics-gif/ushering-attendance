import { type InputHTMLAttributes, forwardRef, useState } from 'react';
import clsx from 'clsx';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);
        const [hasValue, setHasValue] = useState(false);

        const handleFocus = () => setIsFocused(true);
        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            setHasValue(!!e.target.value);
            props.onBlur?.(e);
        };

        return (
            <div className={clsx('input-wrapper', className)}>
                <div
                    className={clsx(
                        'input-container',
                        isFocused && 'input-container--focused',
                        error && 'input-container--error'
                    )}
                >
                    {icon && <span className="input-icon">{icon}</span>}
                    <input
                        ref={ref}
                        className="input-field"
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        {...props}
                    />
                    {label && (
                        <label
                            className={clsx(
                                'input-label',
                                (isFocused || hasValue || props.value) && 'input-label--float'
                            )}
                        >
                            {label}
                        </label>
                    )}
                </div>
                {error && <span className="input-error">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
