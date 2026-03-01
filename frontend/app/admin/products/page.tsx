'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Package,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { Card, CardContent, Button, Badge, Input } from '@/components/ui';

interface AdminProduct {
    id: string;
    title: string;
    slug: string;
    status: string;
    featured: boolean;
    variants: Array<{ price: number; inventoryQty: number }>;
    images: Array<{ url: string; alt: string | null }>;
    _count?: { reviews: number };
}

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'error'> = {
    ACTIVE: 'success',
    DRAFT: 'warning',
    ARCHIVED: 'error',
};

export default function AdminProductsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>('');
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'products', { search, status, page, limit }],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(limit));
            if (search) params.set('search', search);
            if (status) params.set('status', status);
            const res = await api.get(`/products?${params}`);
            return res.data;
        },
    });

    const deleteProduct = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
        },
    });

    const products: AdminProduct[] = data?.products || [];
    const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

    const handleDelete = async (id: string, title: string) => {
        if (confirm(`Are you sure you want to delete "${title}"?`)) {
            deleteProduct.mutate(id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black">Products</h1>
                    <p className="text-gray-600">
                        {pagination.total} products total
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/products/new">
                        <Plus className="w-4 h-4" />
                        Add Product
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <Card shadow="md">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search products..."
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
                            className="w-full sm:w-40 h-12 px-4 bg-white border-4 border-black rounded-xl font-medium focus:outline-none shadow-[4px_4px_0px_#000]"
                        >
                            <option value="">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="DRAFT">Draft</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Products Table */}
            <Card shadow="md">
                {isLoading ? (
                    <CardContent className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    </CardContent>
                ) : products.length === 0 ? (
                    <CardContent className="p-12 text-center">
                        <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="font-black">No products found</h3>
                        <p className="text-gray-600 mt-1">
                            {search || status ? 'Try adjusting your filters' : 'Add your first product'}
                        </p>
                    </CardContent>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b-4 border-black">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase">
                                        Product
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase">
                                        Price
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase">
                                        Inventory
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-black uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-4 divide-black">
                                {products.map((product) => {
                                    const variant = product.variants[0];
                                    const image = product.images[0];
                                    const totalInventory = product.variants.reduce(
                                        (sum, v) => sum + v.inventoryQty,
                                        0
                                    );

                                    return (
                                        <tr key={product.id} className="hover:bg-yellow-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gray-100 border-2 border-black shrink-0 relative overflow-hidden rounded-lg">
                                                        {image ? (
                                                            <Image
                                                                src={image.url}
                                                                alt={image.alt || product.title}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Package className="w-5 h-5 text-gray-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Link
                                                            href={`/admin/products/${product.id}`}
                                                            className="font-bold hover:text-red-500"
                                                        >
                                                            {product.title}
                                                        </Link>
                                                        {product.featured && (
                                                            <span className="ml-2 text-xs text-yellow-600 font-bold">
                                                                ★ Featured
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={statusBadgeVariant[product.status] ?? 'pending'} size="sm">
                                                    {product.status ?? 'PENDING'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 font-bold">
                                                {variant ? formatPrice(variant.price) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    'font-bold',
                                                    totalInventory <= 0 && 'text-red-500',
                                                    totalInventory > 0 && totalInventory <= 10 && 'text-yellow-600'
                                                )}>
                                                    {totalInventory}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/products/${product.id}`}
                                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(product.id, product.title)}
                                                        disabled={deleteProduct.isPending}
                                                        className="p-2 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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
