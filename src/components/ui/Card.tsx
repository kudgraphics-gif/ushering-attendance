import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import './Card.css';

interface CardProps {
    children: ReactNode;
    glass?: boolean;
    hover?: boolean;
    className?: string;
    onClick?: () => void;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
    children,
    glass,
    hover,
    className,
    onClick,
    padding = 'md'
}: CardProps) {
    return (
        <motion.div
            className={clsx(
                'card',
                glass && 'glass-md',
                hover && 'card--hover',
                `card--padding-${padding}`,
                onClick && 'card--clickable',
                className
            )}
            onClick={onClick}
            whileHover={hover ? { y: -4, boxShadow: 'var(--shadow-lg)' } : undefined}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            {children}
        </motion.div>
    );
}
