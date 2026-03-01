'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Tag,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { Card, CardContent, Button, Badge, Input } from '@/components/ui';

export default function AdminDiscountsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'discounts', { search, page, limit }],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(limit));
            if (search) params.set('search', search);
            const res = await api.get(`/discounts?${params}`);
            return res.data;
        },
    });

    const deleteDiscount = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/discounts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'discounts'] });
        },
    });

    const discounts = data?.discounts || [];
    const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

    const handleDelete = async (id: string, code: string) => {
        if (confirm(`Are you sure you want to delete discount "${code}"?`)) {
            deleteDiscount.mutate(id);
        }
    };

    const isActive = (discount: any) => {
        const now = new Date();
        const start = discount.startsAt ? new Date(discount.startsAt) : null;
        const end = discount.endsAt ? new Date(discount.endsAt) : null;
        return discount.active && (!start || now >= start) && (!end || now <= end);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black">Discounts</h1>
                    <p className="text-gray-600">
                        {pagination.total} discount codes
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/discounts/new">
                        <Plus className="w-4 h-4" />
                        Create Discount
                    </Link>
                </Button>
            </div>

            {/* Search */}
            <Card shadow="md">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by code..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-12"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Discounts Table */}
            <Card shadow="md">
                {isLoading ? (
                    <CardContent className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    </CardContent>
                ) : discounts.length === 0 ? (
                    <CardContent className="p-12 text-center">
                        <Tag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="font-black">No discounts found</h3>
                        <p className="text-gray-600 mt-1">
                            {search ? 'Try adjusting your search' : 'Create your first discount'}
                        </p>
                    </CardContent>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b-4 border-black">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase">
                                        Code
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase">
                                        Type
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase">
                                        Value
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase">
                                        Uses
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-black uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-4 divide-black">
                                {discounts.map((discount: any) => (
                                    <tr key={discount.id} className="hover:bg-yellow-50">
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-bold bg-gray-100 px-2 py-1 rounded border-2 border-black">
                                                {discount.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {discount.type === 'PERCENTAGE' ? 'Percentage' : discount.type === 'FREE_SHIPPING' ? 'Free Shipping' : 'Fixed Amount'}
                                        </td>
                                        <td className="px-6 py-4 font-bold">
                                            {discount.type === 'PERCENTAGE'
                                                ? `${discount.value}%`
                                                : formatPrice(discount.value)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold">{discount.usedCount || 0}</span>
                                            {discount.maxUses && (
                                                <span className="text-gray-500"> / {discount.maxUses}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant={isActive(discount) ? 'success' : 'error'}
                                                size="sm"
                                            >
                                                {isActive(discount) ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDelete(discount.id, discount.code)}
                                                    disabled={deleteDiscount.isPending}
                                                    className="p-2 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
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
