import { useState } from 'react';
import { Search, Bell, Menu, RotateCcw } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../ui/Avatar';
import { ThemeToggle } from '../ui/ThemeToggle';
import toast from 'react-hot-toast';
import './Header.css';

interface HeaderProps {
    onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const user = useAuthStore((state) => state.user);
    const refresh = useAuthStore((state) => state.refresh);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refresh();
            toast.success('Session refreshed');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Refresh failed');
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <header className="header glass-md">
            <button className="header__menu-btn" onClick={onMenuClick}>
                <Menu size={24} />
            </button>

            <div className="header__search">
                <Search size={20} className="header__search-icon" />
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="header__search-input"
                />
            </div>

            <div className="header__actions">
                <ThemeToggle />
                <button 
                    className="header__notification-btn"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    title="Refresh session"
                >
                    <RotateCcw size={20} className={isRefreshing ? 'header__refresh-spinning' : ''} />
                </button>
                <button className="header__notification-btn">
                    <Bell size={20} />
                    <span className="header__notification-badge">3</span>
                </button>

                {user && (
                    <div className="header__user">
                        <Avatar src={user.avatar_url} alt={user.first_name} size="md" />
                        <div className="header__user-info">
                            <span className="header__user-name">
                                {user.first_name} {user.last_name}
                            </span>
                            <span className="header__user-role">{user.role}</span>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
