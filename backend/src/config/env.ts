import dotenv from 'dotenv';

dotenv.config();

// Helper to get required environment variables with clear error messages
function getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`${key} is required. Please set it in your environment variables.`);
    }
    return value;
}

// Helper for secrets that are required in production, warn in development
function getSecretEnv(key: string, devFallback: string): string {
    const value = process.env[key];
    const isProduction = process.env.NODE_ENV === 'production';
    if (!value) {
        if (isProduction) {
            throw new Error(`${key} is required in production. Please set it in your environment variables.`);
        }
        console.warn(`[CONFIG] WARNING: ${key} is not set. Using insecure dev fallback. Set it before going to production.`);
        return devFallback;
    }
    return value;
}

export const env = {
    // Server
    PORT: parseInt(process.env.PORT || '3001', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Database - Required, no fallback
    DATABASE_URL: getRequiredEnv('DATABASE_URL'),

    // Frontend
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Auth - Required in production (secret for signing session cookies)
    BETTER_AUTH_SECRET: getSecretEnv('BETTER_AUTH_SECRET', 'dev-only-insecure-secret-do-not-use-in-production'),

    // Features
    MOCK_EMAIL: process.env.MOCK_EMAIL === 'true',

    // Helpers
    isDevelopment: !process.env.NODE_ENV || process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
};

export default env;
