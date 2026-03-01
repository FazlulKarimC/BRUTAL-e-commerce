import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Extend axios config to track retry attempts
interface RetryConfig extends InternalAxiosRequestConfig {
    _retryCount?: number;
}

// Cold start retry configuration
const COLD_START_RETRY_DELAY = 3000; // 3 seconds
const MAX_COLD_START_RETRIES = 2;

export const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    timeout: 30000, // 30 second timeout for cold start scenarios
});

// Request interceptor to add session ID
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        // Add session ID for guest cart
        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) {
            config.headers['X-Session-Id'] = sessionId;
        }
    }
    return config;
});

// Response interceptor with cold start retry logic
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const config = error.config as RetryConfig;

        // Check if this is a cold start related error
        const isColdStartError =
            error.code === 'ECONNABORTED' || // Timeout
            error.code === 'ERR_NETWORK' ||   // Network error (server not responding)
            error.response?.status === 503 || // Service unavailable
            error.response?.status === 502;   // Bad gateway

        // Initialize retry count
        config._retryCount = config._retryCount || 0;

        // Only retry idempotent methods — never retry POST/PUT/PATCH/DELETE
        // to prevent duplicate order/checkout mutations
        const method = (config.method || 'get').toLowerCase();
        const isIdempotent = ['get', 'head', 'options'].includes(method);

        // Retry if it's a cold start error and we haven't exceeded max retries
        if (isColdStartError && isIdempotent && config._retryCount < MAX_COLD_START_RETRIES) {
            config._retryCount += 1;

            console.log(`[API] Server may be waking up. Retrying in ${COLD_START_RETRY_DELAY / 1000}s... (attempt ${config._retryCount}/${MAX_COLD_START_RETRIES})`);

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, COLD_START_RETRY_DELAY));

            // Retry the request
            return api.request(config);
        }

        // 401 handling delegated to individual components/pages
        // They can redirect to login or show appropriate UI based on context
        return Promise.reject(error);
    }
);

export default api;
