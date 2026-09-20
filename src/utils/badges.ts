import type { UserDto } from '../types';

export interface BadgeDefinition {
    id: string;
    name: string;
    description: string;
    /** Lucide icon component name (e.g. 'Zap', 'Star') */
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
        icon: 'Zap',
        color: '#FFD700',
        bgGradient: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)',
        category: 'punctuality',
    },
    {
        id: 'sunday_vanguard',
        name: 'Sunday Vanguard',
        description: 'Arrived and checked in early before 9:30 AM on a Sunday morning shift.',
        icon: 'Star',
        color: '#0A84FF',
        bgGradient: 'linear-gradient(135deg, rgba(10, 132, 255, 0.2) 0%, rgba(0, 217, 255, 0.1) 100%)',
        category: 'punctuality',
    },
    {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Maintained a 5+ consecutive service check-in streak without missing a shift.',
        icon: 'Flame',
        color: '#FF453A',
        bgGradient: 'linear-gradient(135deg, rgba(255, 69, 58, 0.2) 0%, rgba(255, 159, 10, 0.1) 100%)',
        category: 'streak',
    },
    {
        id: 'punctual_servant',
        name: 'Punctual Servant',
        description: 'Maintained 90%+ attendance rate with 0 active disciplinary strikes.',
        icon: 'ShieldCheck',
        color: '#34C759',
        bgGradient: 'linear-gradient(135deg, rgba(52, 199, 89, 0.2) 0%, rgba(48, 209, 88, 0.1) 100%)',
        category: 'punctuality',
    },
    {
        id: 'sanctuary_veteran',
        name: 'Sanctuary Veteran',
        description: 'Active ushering ministry member for over 2 years.',
        icon: 'Landmark',
        color: '#AF52DE',
        bgGradient: 'linear-gradient(135deg, rgba(175, 82, 222, 0.2) 0%, rgba(191, 90, 242, 0.1) 100%)',
        category: 'loyalty',
    },
    {
        id: 'leader_exemplar',
        name: 'Leader Exemplar',
        description: 'Assigned as a Hall Leader or System Administrator serving the ministry.',
        icon: 'Crown',
        color: '#D4AF37',
        bgGradient: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(255, 215, 0, 0.1) 100%)',
        category: 'leadership',
    },
];

/**
 * Compute the longest run of consecutive service days (Sundays = 0, Wednesdays = 3)
 * that the user attended without missing one.
 */
function computeMaxConsecutiveStreak(history: any[]): number {
    if (!history.length) return 0;

    // Get all attended dates sorted ascending
    const attendedDates = history
        .map((h) => h.date?.split('T')[0])
        .filter(Boolean)
        .sort();

    const attendedSet = new Set(attendedDates);

    // Build a timeline of all service days from first attended to today
    if (attendedDates.length === 0) return 0;

    const firstDate = new Date(attendedDates[0]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let maxStreak = 0;
    let currentStreak = 0;
    const cursor = new Date(firstDate);

    while (cursor <= today) {
        const dayOfWeek = cursor.getDay();
        // Only count Sundays (0) and Wednesdays (3) as service days
        if (dayOfWeek === 0 || dayOfWeek === 3) {
            const dateStr = cursor.toISOString().split('T')[0];
            if (attendedSet.has(dateStr)) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    return maxStreak;
}

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

    const strikeCount = user.strike || 0;
    const isLeaderOrAdmin = user.role === 'Admin' || user.role === 'Leader' || user.role === 'Technical';

    // Early Bird: only Wednesday check-ins (day 3) before 16:45
    const hasEarlyBird = history.some((h) => {
        if (!h.time_in || !h.date) return false;
        const d = new Date(h.date);
        return d.getDay() === 3 && h.time_in < '16:45:00';
    });

    // Count how many Wednesday check-ins exist (for progress)
    const wednesdayCheckIns = history.filter((h) => {
        if (!h.date) return false;
        return new Date(h.date).getDay() === 3;
    }).length;

    // Sunday Vanguard: only Sunday check-ins (day 0) before 09:30
    const hasSundayVanguard = history.some((h) => {
        if (!h.time_in || !h.date) return false;
        const d = new Date(h.date);
        return d.getDay() === 0 && h.time_in < '09:30:00';
    });

    // Count Sunday check-ins for progress
    const sundayCheckIns = history.filter((h) => {
        if (!h.date) return false;
        return new Date(h.date).getDay() === 0;
    }).length;

    // Streak Master: compute real consecutive streak
    const maxStreak = computeMaxConsecutiveStreak(history);

    return BADGE_MASTER_LIST.map((badge) => {
        let unlocked = false;
        let progress = 0;

        switch (badge.id) {
            case 'early_bird':
                // Only unlocked if they actually checked in early on a Wednesday
                unlocked = hasEarlyBird;
                // Progress: having at least 1 Wednesday check-in shows effort
                progress = unlocked ? 100 : Math.min(99, wednesdayCheckIns > 0 ? 50 : 0);
                break;

            case 'sunday_vanguard':
                // Only unlocked if they actually checked in before 9:30 on a Sunday
                unlocked = hasSundayVanguard;
                progress = unlocked ? 100 : Math.min(99, sundayCheckIns > 0 ? 50 : 0);
                break;

            case 'streak_master':
                // Real consecutive service-day streak of 5+
                unlocked = maxStreak >= 5;
                progress = unlocked ? 100 : Math.min(99, Math.round((maxStreak / 5) * 100));
                break;

            case 'punctual_servant':
                // Strict: 90%+ attendance rate AND 0 strikes
                unlocked = summaryRate >= 90 && strikeCount === 0;
                progress = unlocked ? 100 : Math.max(0, Math.round(summaryRate));
                break;

            case 'sanctuary_veteran':
                // Only based on years served, no attendance-count shortcut
                unlocked = yearsServed >= 2;
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
