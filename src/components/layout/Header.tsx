import { useState } from 'react';
import { Search, Menu, MapPin } from 'lucide-react'; // Added MapPin
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../ui/Avatar';
import { ThemeToggle } from '../ui/ThemeToggle';
import './Header.css';

interface HeaderProps {
    onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const user = useAuthStore((state) => state.user);
    const [searchQuery, setSearchQuery] = useState('');
    


    // Helper to get the display string
    const getRosterDisplay = () => {
        if (!user) return '';
        // Access properties directly (assuming they exist on the user object based on API response)
        const hall = (user as any).current_roster_hall;
        const allocation = (user as any).current_roster_allocation;

        if (!hall) return 'Pending';
        if (allocation) return `${hall} - ${allocation}`;
        return hall;
    };

    const rosterStatus = getRosterDisplay();
    const isPending = rosterStatus === 'Pending';

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
            

                {user && (
                    <>
                        {/* Roster Status Badge */}
                        <div 
                            className={`header__roster-status ${isPending ? 'header__roster-status--pending' : 'header__roster-status--active'}`}
                            title="Current Roster Allocation"
                        >
                            <MapPin size={14} />
                            <span>{rosterStatus}</span>
                        </div>

                        <div className="header__user">
                            <Avatar src={user.avatar_url} alt={user.first_name} size="md" />
                            <div className="header__user-info">
                                <span className="header__user-name">
                                    {user.first_name} {user.last_name}
                                </span>
                                <span className="header__user-role">{user.role}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}