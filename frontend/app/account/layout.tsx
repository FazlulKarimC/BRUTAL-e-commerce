'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, Package, MapPin, Heart, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Card, CardContent, Button, Skeleton } from '@/components/ui';

const navItems = [
    { href: '/account', label: 'Overview', icon: User, exact: true },
    { href: '/account/orders', label: 'Orders', icon: Package },
    { href: '/account/addresses', label: 'Addresses', icon: MapPin },
    { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
];

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, user, logout, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/login?redirect=/account');
        }
    }, [isAuthenticated, isLoading, router]);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen py-12 bg-[#FAFAFA]">
                <div className="container mx-auto px-4">
                    <Skeleton className="h-10 w-48 mb-8" />
                    <div className="flex gap-8">
                        <div className="w-64 space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-12" />
                            ))}
                        </div>
                        <Skeleton className="flex-1 h-96" />
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="py-8 min-h-screen bg-[#FAFAFA]">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-black">My Account</h1>
                    <p className="text-gray-600 mt-1">
                        Welcome back, {user?.name || 'Customer'}
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="lg:w-64 shrink-0">
                        <Card shadow="md">
                            <CardContent className="p-4 space-y-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = item.exact
                                        ? pathname === item.href
                                        : pathname?.startsWith(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-3 px-4 py-3 font-medium rounded-lg transition-all',
                                                isActive
                                                    ? 'bg-black text-white'
                                                    : 'hover:bg-yellow-400 hover:translate-x-1'
                                            )}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {item.label}
                                            <ChevronRight className={cn(
                                                'w-4 h-4 ml-auto transition-transform',
                                                isActive && 'rotate-90'
                                            )} />
                                        </Link>
                                    );
                                })}

                                <hr className="my-4 border-gray-200" />

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-3 font-medium text-red-500 hover:bg-red-50 w-full text-left rounded-lg transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Sign Out
                                </button>
                            </CardContent>
                        </Card>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
