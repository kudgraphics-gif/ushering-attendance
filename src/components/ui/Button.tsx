import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    icon?: ReactNode;
    loading?: boolean;
    fullWidth?: boolean;
}

export function Button({
    variant = 'primary',
    size = 'md',
    icon,
    loading,
    fullWidth,
    children,
    className,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <motion.div
            whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
            whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'inline-block', width: fullWidth ? '100%' : 'auto' }}
        >
            <button
                className={clsx(
                    'button',
                    `button--${variant}`,
                    `button--${size}`,
                    fullWidth && 'button--full',
                    className
                )}
                disabled={disabled || loading}
                {...props}
            >
                {loading ? (
                    <span className="button__spinner" />
                ) : icon ? (
                    <span className="button__icon">{icon}</span>
                ) : null}
                {children}
            </button>
        </motion.div>
    );
}

