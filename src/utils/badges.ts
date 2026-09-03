import type { UserDto } from '../types';

export interface BadgeDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    bgGradient: string;
    category: 'punctuality' | 'loyalty' | 'leadership' | 'streak';
    unlocked: boolean;
    progress: number; // 0 to 100
    unlockedAt?: string;
}

export const BADGE_MASTER_LIST: Omit<BadgeDefinition, 'unlocked' | 'progress' | 'unlockedAt'>[] = [
    {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Checked in early for a Wednesday Koinonia Service before duty post cutoff.',
        icon: '⚡',
        color: '#FFD700',
        bgGradient: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)',
        category: 'punctuality',
    },
    {
        id: 'sunday_vanguard',
        name: 'Sunday Vanguard',
        description: 'Arrived and checked in early before 9:30 AM on a Sunday morning shift.',
        icon: '🌟',
        color: '#0A84FF',
        bgGradient: 'linear-gradient(135deg, rgba(10, 132, 255, 0.2) 0%, rgba(0, 217, 255, 0.1) 100%)',
        category: 'punctuality',
    },
    {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Maintained a 5+ consecutive service check-in streak without missing a shift.',
        icon: '🔥',
        color: '#FF453A',
        bgGradient: 'linear-gradient(135deg, rgba(255, 69, 58, 0.2) 0%, rgba(255, 159, 10, 0.1) 100%)',
        category: 'streak',
    },
    {
        id: 'punctual_servant',
        name: 'Punctual Servant',
        description: 'Maintained 90%+ attendance rate with 0 active disciplinary strikes.',
        icon: '🛡️',
        color: '#34C759',
        bgGradient: 'linear-gradient(135deg, rgba(52, 199, 89, 0.2) 0%, rgba(48, 209, 88, 0.1) 100%)',
        category: 'punctuality',
    },
    {
        id: 'sanctuary_veteran',
        name: 'Sanctuary Veteran',
        description: 'Active ushering ministry member for over 2 years.',
        icon: '🏛️',
        color: '#AF52DE',
        bgGradient: 'linear-gradient(135deg, rgba(175, 82, 222, 0.2) 0%, rgba(191, 90, 242, 0.1) 100%)',
        category: 'loyalty',
    },
    {
        id: 'leader_exemplar',
        name: 'Leader Exemplar',
        description: 'Assigned as a Hall Leader or System Administrator serving the ministry.',
        icon: '👑',
        color: '#D4AF37',
        bgGradient: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(255, 215, 0, 0.1) 100%)',
        category: 'leadership',
    },
];

/**
 * Calculates unlocked badges and progress percentage for a given user and attendance history
 */
export function getUserBadges(
    user: Partial<UserDto> | null,
    history: any[] = [],
    summaryRate: number = 0
): BadgeDefinition[] {
    if (!user) {
        return BADGE_MASTER_LIST.map((b) => ({ ...b, unlocked: false, progress: 0 }));
    }

    const currentYear = new Date().getFullYear();
    const joinedYear = parseInt(user.year_joined || `${currentYear}`, 10);
    const yearsServed = Math.max(0, currentYear - joinedYear);

    // Calculate check-in count & streaks
    const totalPresent = history.length;
    const strikeCount = user.strike || 0;
    const isLeaderOrAdmin = user.role === 'Admin' || user.role === 'Leader' || user.role === 'Technical';

    // Early bird evaluation: check if any attendance was early (Wed/Sun)
    const hasEarlyBird = history.some((h) => {
        if (!h.time_in) return false;
        const timeIn = h.time_in;
        // Wednesday early: before 16:45
        return timeIn < '16:45:00';
    });

    const hasSundayVanguard = history.some((h) => {
        if (!h.time_in || !h.date) return false;
        const d = new Date(h.date);
        return d.getDay() === 0 && h.time_in < '09:30:00';
    });

    return BADGE_MASTER_LIST.map((badge) => {
        let unlocked = false;
        let progress = 0;

        switch (badge.id) {
            case 'early_bird':
                unlocked = hasEarlyBird || totalPresent >= 3;
                progress = unlocked ? 100 : Math.min(99, Math.round((totalPresent / 3) * 100));
                break;

            case 'sunday_vanguard':
                unlocked = hasSundayVanguard || totalPresent >= 5;
                progress = unlocked ? 100 : Math.min(99, Math.round((totalPresent / 5) * 100));
                break;

            case 'streak_master':
                unlocked = totalPresent >= 5;
                progress = Math.min(100, Math.round((totalPresent / 5) * 100));
                break;

            case 'punctual_servant':
                const rateOk = summaryRate >= 80 || (totalPresent >= 2 && summaryRate > 0);
                unlocked = rateOk && strikeCount === 0;
                progress = unlocked ? 100 : Math.max(10, Math.round(summaryRate));
                break;

            case 'sanctuary_veteran':
                unlocked = yearsServed >= 2 || totalPresent >= 10;
                progress = unlocked ? 100 : Math.min(99, Math.round((yearsServed / 2) * 100));
                break;

            case 'leader_exemplar':
                unlocked = isLeaderOrAdmin;
                progress = unlocked ? 100 : 0;
                break;

            default:
                break;
        }

        return {
            ...badge,
            unlocked,
            progress: Math.min(100, Math.max(0, progress)),
            unlockedAt: unlocked ? 'Earned' : undefined,
        };
    });
}
