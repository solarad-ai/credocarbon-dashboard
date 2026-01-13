/**
 * API Configuration
 * Centralized API URL configuration with production fallback
 */

// Production API URL - hardcoded for Cloud Run deployment
const PRODUCTION_API_URL = 'https://credocarbon-api-641001192587.asia-south2.run.app';

// Use environment variable if set, otherwise fall back to production URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || PRODUCTION_API_URL;

// API URL with /api suffix for endpoints that need it
export const API_URL = `${API_BASE_URL}/api`;

export default API_BASE_URL;
