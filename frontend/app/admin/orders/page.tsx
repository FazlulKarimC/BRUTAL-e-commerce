'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
    Search,
    ShoppingCart,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Eye,
    Clock,
} from 'lucide-react';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Card, CardContent, Button, Badge, Input } from '@/components/ui';

const statusBadgeVariant: Record<string, 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'> = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
};

export default function AdminOrdersPage() {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>('');
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'orders', { search, status, page, limit }],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(limit));
            if (search) params.set('search', search);
            if (status) params.set('status', status);
            const res = await api.get(`/orders?${params}`);
            return res.data;
        },
    });

    const orders = data?.orders || [];
    const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black">Orders</h1>
                <p className="text-gray-600">
                    {pagination.total} orders total
                </p>
            </div>

            {/* Filters */}
            <Card shadow="md">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search by order # or email..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-12"
                            />
                        </div>
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="w-full sm:w-44 h-12 px-4 bg-white border-4 border-black rounded-xl font-medium focus:outline-none shadow-[4px_4px_0px_#000]"
                        >
                            <option value="">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Orders Table */}
            <Card shadow="md">
                {isLoading ? (
                    <CardContent className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    </CardContent>
                ) : orders.length === 0 ? (
                    <CardContent className="p-12 text-center">
                        <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="font-black">No orders found</h3>
                        <p className="text-gray-600 mt-1">
                            {search || status ? 'Try adjusting your filters' : 'Orders will appear here'}
                        </p>
                    </CardContent>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b-4 border-black">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase">
                                        Order
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase">
                                        Customer
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase">
                                        Items
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase">
                                        Total
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase">
                                        Date
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-black uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-4 divide-black">
                                {orders.map((order: any) => (
                                    <tr key={order.id} className="hover:bg-yellow-50">
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="font-bold hover:text-red-500"
                                            >
                                                #{order.orderNumber}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div>{order.email}</div>
                                            {order.phone && (
                                                <div className="text-gray-500">{order.phone}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.items?.length || 0} items
                                        </td>
                                        <td className="px-6 py-4 font-bold">
                                            {formatPrice(order.total)}
                                        </td>
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
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t-4 border-black flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Page {pagination.page} of {pagination.totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= pagination.totalPages}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
