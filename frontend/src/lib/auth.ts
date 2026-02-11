/**
 * Authentication utilities for session management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://credocarbon-api-641001192587.asia-south2.run.app/api';

/**
 * Check if the current session token is valid (not expired) based on client-side expiry
 * @returns true if token exists and client-side expiry hasn't passed
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
 * Attempt to refresh the access token using the stored refresh token.
 * @returns true if refresh succeeded, false otherwise
 */
export async function tryRefreshSession(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        // Update tokenExpiry based on whether "Remember Me" was selected
        const rememberMe = localStorage.getItem('rememberMe') === 'true';
        const expiryDays = rememberMe ? 30 : 1;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiryDays);
        localStorage.setItem('tokenExpiry', expiryDate.toISOString());

        return true;
    } catch {
        return false;
    }
}

/**
 * Async session validity check: first checks client-side expiry, 
 * if invalid, attempts to refresh the token before giving up.
 * Use this in route guards / layout components.
 * @returns true if session is valid (possibly after refresh)
 */
export async function isSessionValidAsync(): Promise<boolean> {
    // If client-side expiry is still valid, session is good
    if (isSessionValid()) {
        return true;
    }

    // Client-side expiry passed, but we might have a valid refresh token
    const hasRefreshToken = typeof window !== 'undefined' && !!localStorage.getItem('refreshToken');
    if (hasRefreshToken) {
        return tryRefreshSession();
    }

    return false;
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
    localStorage.removeItem('refreshToken');
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

