import clsx from 'clsx';
import './Avatar.css';

interface AvatarProps {
    src?: string;
    alt?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    fallback?: string;
    className?: string;
}

export function Avatar({ src, alt, size = 'md', fallback, className }: AvatarProps) {
    const initials = fallback || alt?.charAt(0).toUpperCase() || '?';

    return (
        <div className={clsx('avatar', `avatar--${size}`, className)}>
            {src ? (
                <img src={src} alt={alt} className="avatar__image" />
            ) : (
                <span className="avatar__fallback">{initials}</span>
            )}
        </div>
    );
}
