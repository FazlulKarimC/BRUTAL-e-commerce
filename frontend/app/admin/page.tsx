'use client';

import Link from 'next/link';
import {
    DollarSign,
    ShoppingCart,
    Users,
    Package,
    TrendingUp,
    ArrowRight,
    Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';

interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    recentOrders: Array<{
        id: string;
        orderNumber: string;
        email: string;
        total: number;
        status: string;
        createdAt: string;
    }>;
    topProducts: Array<{
        title: string;
        sold: number;
    }>;
    revenueGrowth: number;
}

function useDashboardStats() {
    return useQuery<DashboardStats>({
        queryKey: ['admin', 'dashboard'],
        queryFn: async () => {
            // Fetch stats from server-side aggregation endpoints
            const [statsRes, recentOrdersRes, customersRes, productsRes, analyticsRes] = await Promise.all([
                api.get('/orders/stats'),           // Server-side aggregated revenue
                api.get('/orders?limit=5'),          // Only recent 5 for display (staff route)
                api.get('/customers?limit=1'),
                api.get('/products?limit=1'),
                api.get('/orders/analytics/dashboard').catch(() => ({ data: {} })), // New analytics
            ]);

            const recentOrders = recentOrdersRes.data.orders || [];
            const totalCustomers = customersRes.data.pagination?.total || 0;
            const totalProducts = productsRes.data.pagination?.total || 0;
            const analytics = analyticsRes.data || {};

            return {
                totalRevenue: statsRes.data.totalRevenue || 0,
                totalOrders: statsRes.data.totalOrders || 0,
                totalCustomers,
                totalProducts,
                recentOrders: recentOrders.slice(0, 5),
                topProducts: analytics.topProducts || [],
                revenueGrowth: analytics.revenue?.growth || 0,
            };
        },
    });
}

const statusBadgeVariant: Record<string, 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'> = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
};

export default function AdminDashboard() {
    const { data: stats, isLoading } = useDashboardStats();

    const statCards = [
        {
            title: 'Total Revenue',
            value: formatPrice(stats?.totalRevenue || 0),
            icon: DollarSign,
            color: 'bg-green-500',
            href: '/admin/orders',
        },
        {
            title: 'Orders',
            value: stats?.totalOrders || 0,
            icon: ShoppingCart,
            color: 'bg-blue-500',
            href: '/admin/orders',
        },
        {
            title: 'Customers',
            value: stats?.totalCustomers || 0,
            icon: Users,
            color: 'bg-purple-500',
            href: '/admin/customers',
        },
        {
            title: 'Products',
            value: stats?.totalProducts || 0,
            icon: Package,
            color: 'bg-yellow-500',
            href: '/admin/products',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">Dashboard</h1>
                    <p className="text-gray-600">
                        Welcome back! Here's what's happening today.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button asChild>
                        <Link href="/admin/products/new">
                            <Package className="w-4 h-4" />
                            Add Product
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link key={stat.title} href={stat.href}>
                            <Card shadow="md" hover="liftSm" className="cursor-pointer">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className={`p-3 ${stat.color} text-white rounded-lg`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div className="mt-4">
                                        {isLoading ? (
                                            <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
                                        ) : (
                                            <p className="text-3xl font-black">{stat.value}</p>
                                        )}
                                        <p className="text-gray-600 text-sm mt-1">
                                            {stat.title}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* Recent Orders */}
            <Card shadow="md">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Orders</CardTitle>
                    <Link
                        href="/admin/orders"
                        className="text-sm font-bold text-red-500 hover:underline flex items-center gap-1"
                    >
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </CardHeader>

                {isLoading ? (
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-4 animate-pulse">
                                    <div className="w-24 h-5 bg-gray-200 rounded" />
                                    <div className="w-48 h-5 bg-gray-200 rounded" />
                                    <div className="w-20 h-5 bg-gray-200 rounded" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                ) : stats?.recentOrders.length === 0 ? (
                    <CardContent className="p-12 text-center">
                        <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="font-bold">No orders yet</p>
                    </CardContent>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b-4 border-black">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider">
                                        Order
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-4 divide-black">
                                {stats?.recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-yellow-50">
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="font-bold hover:text-red-500"
                                            >
                                                #{order.orderNumber}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{order.email}</td>
                                        <td className="px-6 py-4 font-bold">{formatPrice(order.total)}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={statusBadgeVariant[order.status] || 'pending'} size="sm">
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/admin/products/new">
                    <Card shadow="md" hover="liftSm" className="cursor-pointer group">
                        <CardContent className="p-6">
                            <Package className="w-8 h-8 text-yellow-500 mb-4" />
                            <h3 className="font-black group-hover:text-red-500">Add Product</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Create a new product listing
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/discounts/new">
                    <Card shadow="md" hover="liftSm" className="cursor-pointer group">
                        <CardContent className="p-6">
                            <DollarSign className="w-8 h-8 text-green-500 mb-4" />
                            <h3 className="font-black group-hover:text-red-500">Create Discount</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Set up a new discount code
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/orders">
                    <Card shadow="md" hover="liftSm" className="cursor-pointer group">
                        <CardContent className="p-6">
                            <ShoppingCart className="w-8 h-8 text-blue-500 mb-4" />
                            <h3 className="font-black group-hover:text-red-500">Manage Orders</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                View and update order statuses
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
