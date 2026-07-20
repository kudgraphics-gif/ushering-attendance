/**
 * Browser Notification Utility for Usher Attendance Check-Ins
 */

export const NOTIFICATION_STORAGE_KEY = 'attendance_reminders_enabled';

/**
 * Checks if the current environment is an iOS device (iPhone/iPad/iPod)
 */
export function isIOSDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return (
        /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
}

/**
 * Checks if browser notifications are supported or if on iOS environment
 */
export function isNotificationSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return ('Notification' in window) || isIOSDevice();
}

/**
 * Gets the current notification permission state
 */
export function getNotificationPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
    return Notification.permission;
}

/**
 * Requests browser permission to show desktop notifications
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    if ('Notification' in window && typeof Notification.requestPermission === 'function') {
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (err) {
            console.error('Error requesting notification permission:', err);
            return false;
        }
    }
    return false;
}

/**
 * Triggers an immediate browser notification if permission is granted
 */
export function showNotification(title: string, body: string, iconUrl?: string) {
    if (!isNotificationSupported() || Notification.permission !== 'granted') {
        return;
    }

    try {
        // Use service worker notification if available, fallback to window.Notification
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    body,
                    icon: iconUrl || '/favicon.ico',
                    badge: iconUrl || '/favicon.ico',
                    tag: 'check-in-reminder',
                    requireInteraction: true
                });
            }).catch(() => {
                new Notification(title, { body, icon: iconUrl });
            });
        } else {
            new Notification(title, { body, icon: iconUrl });
        }
    } catch (err) {
        console.error('Failed to trigger notification:', err);
    }
}

/**
 * Helper to calculate milliseconds until the next reminder event
 * Wednesdays at 5:00 PM (17:00)
 * Sundays at 4:30 PM (16:30)
 */
export function getMsUntilNextReminder(): { ms: number; targetDay: string; targetTime: string } {
    const now = new Date();
    
    // Reminders array: day 0 = Sunday, day 3 = Wednesday
    const reminders = [
        { day: 0, hours: 16, minutes: 30, label: 'Sunday Check-in Service' },
        { day: 3, hours: 17, minutes: 0, label: 'Wednesday Koinonia Service' }
    ];

    let closestDiff = Infinity;
    let closestReminder = reminders[0];

    reminders.forEach((r) => {
        let target = new Date(now);
        target.setHours(r.hours, r.minutes, 0, 0);

        // Find how many days to add to get to the target day of the week
        let dayDiff = r.day - now.getDay();
        if (dayDiff < 0 || (dayDiff === 0 && now.getTime() >= target.getTime())) {
            dayDiff += 7; // Go to next week's occurrence
        }

        target.setDate(now.getDate() + dayDiff);
        const diff = target.getTime() - now.getTime();
        
        if (diff < closestDiff) {
            closestDiff = diff;
            closestReminder = r;
        }
    });

    return {
        ms: closestDiff,
        targetDay: closestReminder.day === 0 ? 'Sunday' : 'Wednesday',
        targetTime: closestReminder.hours === 16 ? '4:30 PM' : '5:00 PM'
    };
}
