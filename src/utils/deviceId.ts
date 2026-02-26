/**
 * Device ID utility for tracking device-specific sessions
 * Ensures one login per device and one check-in per device
 */

const DEVICE_ID_KEY = 'device_id';
const DEVICE_SESSION_KEY = 'device_session';
const DEVICE_CHECK_IN_KEY = 'device_check_in';

/**
 * Generate or retrieve a unique device ID
 */
export function getDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
        // Generate a unique device ID using timestamp + random string
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
}

/**
 * Set device session for current user
 */
export function setDeviceSession(userId: string, token: string): void {
    const session = {
        userId,
        token,
        timestamp: Date.now(),
        deviceId: getDeviceId(),
    };
    localStorage.setItem(DEVICE_SESSION_KEY, JSON.stringify(session));
}

/**
 * Get current device session
 */
export function getDeviceSession(): { userId: string; token: string; timestamp: number; deviceId: string } | null {
    const session = localStorage.getItem(DEVICE_SESSION_KEY);
    return session ? JSON.parse(session) : null;
}

/**
 * Check if another user is logged in on this device
 */
export function isAnotherUserLoggedIn(userId: string): boolean {
    const session = getDeviceSession();
    return !!session && session.userId !== userId;
}

/**
 * Clear device session on logout
 */
export function clearDeviceSession(): void {
    localStorage.removeItem(DEVICE_SESSION_KEY);
}

/**
 * Record device check-in to prevent duplicate check-ins
 */
export function recordDeviceCheckIn(userId: string): void {
    const checkIn = {
        userId,
        timestamp: Date.now(),
        deviceId: getDeviceId(),
    };
    localStorage.setItem(DEVICE_CHECK_IN_KEY, JSON.stringify(checkIn));
}

/**
 * Check if device already checked in (within last hour)
 */
export function hasDeviceCheckedInToday(): { userId: string; timestamp: number } | null {
    const checkIn = localStorage.getItem(DEVICE_CHECK_IN_KEY);
    if (!checkIn) return null;

    const parsed = JSON.parse(checkIn);

    // Return check-in if it's still within the same day
    const checkInDate = new Date(parsed.timestamp).toDateString();
    const nowDate = new Date(Date.now()).toDateString();

    if (checkInDate === nowDate) {
        return parsed;
    }

    return null;
}

/**
 * Clear device check-in record
 */
export function clearDeviceCheckIn(): void {
    localStorage.removeItem(DEVICE_CHECK_IN_KEY);
}

const DEVICE_CHECK_OUT_KEY = 'device_check_out';

/**
 * Record device check-out to prevent duplicate sign-outs
 */
export function recordDeviceCheckOut(userId: string): void {
    const checkOut = {
        userId,
        timestamp: Date.now(),
        deviceId: getDeviceId(),
    };
    localStorage.setItem(DEVICE_CHECK_OUT_KEY, JSON.stringify(checkOut));
}

/**
 * Check if device already checked out today
 */
export function hasDeviceCheckedOutToday(): { userId: string; timestamp: number } | null {
    const checkOut = localStorage.getItem(DEVICE_CHECK_OUT_KEY);
    if (!checkOut) return null;

    const parsed = JSON.parse(checkOut);

    // Return check-out if it's still within the same day
    const checkOutDate = new Date(parsed.timestamp).toDateString();
    const nowDate = new Date(Date.now()).toDateString();

    if (checkOutDate === nowDate) {
        return parsed;
    }

    return null;
}

/**
 * Clear device check-out record
 */
export function clearDeviceCheckOut(): void {
    localStorage.removeItem(DEVICE_CHECK_OUT_KEY);
}
