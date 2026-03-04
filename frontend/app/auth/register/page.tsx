'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button, Card, CardContent, Input } from '@/components/ui';

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/account';
    const { register: registerUser } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const password = watch('password', '');

    const passwordChecks = [
        { label: 'At least 8 characters', valid: password.length >= 8 },
        { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
        { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
        { label: 'One number', valid: /[0-9]/.test(password) },
    ];

    const onSubmit = async (data: RegisterFormData) => {
        setError(null);
        setIsSubmitting(true);

        try {
            await registerUser(data.name, data.email, data.password);
            router.push(redirectTo);
        } catch (err: any) {
            setError(err.message || err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card shadow="lg">
            <CardContent className="p-8">
                <h1 className="text-3xl font-black text-center mb-2">Create Account</h1>
                <p className="text-center text-gray-600 mb-8">
                    Join the BRUTALIST movement
                </p>

                {error && (
                    <div className="bg-red-500 text-white p-4 mb-6 border-4 border-black rounded-xl">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="font-bold uppercase tracking-wider text-sm block mb-2">
                            Name
                        </label>
                        <Input
                            type="text"
                            {...register('name')}
                            state={errors.name ? 'error' : 'default'}
                            placeholder="Your name"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="font-bold uppercase tracking-wider text-sm block mb-2">
                            Email
                        </label>
                        <Input
                            type="email"
                            {...register('email')}
                            state={errors.email ? 'error' : 'default'}
                            placeholder="you@example.com"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="font-bold uppercase tracking-wider text-sm block mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                {...register('password')}
                                state={errors.password ? 'error' : 'default'}
                                placeholder="••••••••"
                                className="pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {/* Password Requirements */}
                        <div className="mt-3 space-y-1">
                            {passwordChecks.map((check, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'flex items-center gap-2 text-sm',
                                        check.valid ? 'text-green-600' : 'text-gray-500'
                                    )}
                                >
                                    <Check className={cn('w-4 h-4', !check.valid && 'opacity-30')} />
                                    {check.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="font-bold uppercase tracking-wider text-sm block mb-2">
                            Confirm Password
                        </label>
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            {...register('confirmPassword')}
                            state={errors.confirmPassword ? 'error' : 'default'}
                            placeholder="••••••••"
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.confirmPassword.message}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                        size="lg"
                    >
                        {isSubmitting ? 'Creating account...' : 'Create Account'}
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </form>

                <p className="text-center mt-6">
                    Already have an account?{' '}
                    <Link
                        href="/auth/login"
                        className="font-bold text-red-500 hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
}

function RegisterFormSkeleton() {
    return (
        <Card shadow="lg">
            <CardContent className="p-8 flex items-center justify-center min-h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </CardContent>
        </Card>
    );
}

export default function RegisterPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 bg-[#FAFAFA]">
            <div className="container max-w-md px-4">
                <Suspense fallback={<RegisterFormSkeleton />}>
                    <RegisterForm />
                </Suspense>
            </div>
        </div>
    );
}

