
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./database";
import { verifyPassword, hashPassword } from "../utils/password";
import { env } from "./env";

const isProduction = env.isProduction;

export const auth = betterAuth({
    // Secret for signing session cookies - validated at startup via env.ts
    secret: env.BETTER_AUTH_SECRET,

    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    // Trusted origins for CSRF protection
    trustedOrigins: isProduction
        ? [process.env.FRONTEND_URL].filter(Boolean) as string[]
        : [
            "http://localhost:3000",
            "http://localhost:3001",
            process.env.FRONTEND_URL || "http://localhost:3000",
        ].filter(Boolean) as string[],

    emailAndPassword: {
        enabled: true,
        password: {
            hash: async (password) => {
                return hashPassword(password);
            },
            verify: async ({ password, hash }) => {
                return verifyPassword(password, hash);
            }
        }
    },

    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // Update session every 24 hours
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes cache
        },
    },

    advanced: {
        // Always use secure cookies in production (HTTPS)
        useSecureCookies: isProduction,

        // Cookie settings for cross-domain auth (Vercel frontend ↔ Render backend)
        cookies: {
            session_token: {
                attributes: {
                    // "none" required for cross-domain cookies, "lax" for same-domain/localhost
                    sameSite: isProduction ? "none" : "lax",
                    // secure must be true when sameSite is "none"
                    secure: isProduction,
                    httpOnly: true,
                },
            },
        },
    },

    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "CUSTOMER",
            },
        },
        changeEmail: {
            enabled: true,
        }
    },
});
