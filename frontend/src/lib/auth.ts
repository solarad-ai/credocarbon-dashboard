/**
 * Authentication utilities for session management
 */

/**
 * Check if the current session token is valid (not expired)
 * @returns true if token exists and hasn't expired
 */
export function isSessionValid(): boolean {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('tokenExpiry');

    if (!token || !tokenExpiry) {
        return false;
    }

    const expiryDate = new Date(tokenExpiry);
    const now = new Date();

    return now < expiryDate;
}

/**
 * Get the stored authentication token if valid
 * @returns the token string if valid, null otherwise
 */
export function getValidToken(): string | null {
    if (!isSessionValid()) {
        clearSession();
        return null;
    }
    return localStorage.getItem('token');
}

/**
 * Get the current user data if session is valid
 * @returns parsed user object or null
 */
export function getCurrentUser(): Record<string, unknown> | null {
    if (!isSessionValid()) {
        clearSession();
        return null;
    }

    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}

/**
 * Clear all session data (logout)
 */
export function clearSession(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
}

/**
 * Check if "Remember me" was selected during login
 * @returns true if user selected remember me
 */
export function wasRememberMeSelected(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('rememberMe') === 'true';
}

/**
 * Get the remaining session time in a human-readable format
 * @returns string like "29 days" or "23 hours" or null if expired
 */
export function getSessionTimeRemaining(): string | null {
    if (typeof window === 'undefined') return null;

    const tokenExpiry = localStorage.getItem('tokenExpiry');
    if (!tokenExpiry) return null;

    const expiryDate = new Date(tokenExpiry);
    const now = new Date();

    if (now >= expiryDate) return null;

    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    }
}
