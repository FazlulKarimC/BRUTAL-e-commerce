'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea } from '@/components/ui';

const productSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    shortDescription: z.string().optional().nullable(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
    featured: z.boolean(),
    seoTitle: z.string().optional().nullable(),
    seoDescription: z.string().optional().nullable(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const queryClient = useQueryClient();
    const productId = params?.id as string;
    const [error, setError] = useState<string | null>(null);

    const { data: product, isLoading } = useQuery({
        queryKey: ['admin', 'product', productId],
        queryFn: async () => {
            const res = await api.get(`/products/${productId}`);
            return res.data;
        },
        enabled: !!productId,
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        values: product
            ? {
                title: product.title,
                description: product.description,
                shortDescription: product.shortDescription,
                status: product.status,
                featured: product.featured,
                seoTitle: product.seoTitle,
                seoDescription: product.seoDescription,
            }
            : undefined,
    });

    const updateProduct = useMutation({
        mutationFn: async (data: ProductFormData) => {
            const res = await api.patch(`/products/${productId}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'product', productId] });
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Failed to update product');
        },
    });

    const deleteProduct = useMutation({
        mutationFn: async () => {
            await api.delete(`/products/${productId}`);
        },
        onSuccess: () => {
            router.push('/admin/products');
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || 'Failed to delete product. Please try again.';
            console.error('Delete product failed:', err);
            setError(message);
        },
    });

    const onSubmit = (data: ProductFormData) => {
        setError(null);
        updateProduct.mutate(data);
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this product?')) {
            deleteProduct.mutate();
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-black">Product not found</h2>
                <Button variant="outline" asChild className="mt-4">
                    <Link href="/admin/products">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Products
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/admin/products"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Products
                </Link>
                <div className="flex items-start justify-between">
                    <h1 className="text-3xl font-black">Edit Product</h1>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteProduct.isPending}
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                    <div className="bg-red-500 text-white p-4 border-4 border-black rounded-xl">
                        {error}
                    </div>
                )}

                {updateProduct.isSuccess && (
                    <div className="bg-green-500 text-white p-4 border-4 border-black rounded-xl">
                        Product updated successfully!
                    </div>
                )}

                {/* Basic Info */}
                <Card shadow="md">
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block font-bold text-sm mb-2">Title *</label>
                            <Input
                                {...register('title')}
                                placeholder="Product title"
                            />
                            {errors.title && (
                                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block font-bold text-sm mb-2">Description *</label>
                            <Textarea
                                {...register('description')}
                                className="min-h-[150px]"
                                placeholder="Product description"
                            />
                            {errors.description && (
                                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block font-bold text-sm mb-2">Short Description</label>
                            <Input
                                {...register('shortDescription')}
                                placeholder="Brief description for cards"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Status */}
                <Card shadow="md">
                    <CardHeader>
                        <CardTitle>Status & Visibility</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-bold text-sm mb-2">Status</label>
                                <select
                                    {...register('status')}
                                    className="w-full h-12 px-4 bg-white border-4 border-black rounded-xl font-medium focus:outline-none shadow-[4px_4px_0px_#000]"
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="ARCHIVED">Archived</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 pt-6">
                                <input
                                    {...register('featured')}
                                    type="checkbox"
                                    id="featured"
                                    className="w-6 h-6 border-4 border-black rounded accent-yellow-400"
                                />
                                <label htmlFor="featured" className="font-bold">
                                    Featured Product
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Product Images */}
                {product.images && product.images.length > 0 && (
                    <Card shadow="md">
                        <CardHeader>
                            <CardTitle>Images ({product.images.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {product.images.map((img: any, index: number) => {
                                    // Validate URL - only allow http/https
                                    let isValidUrl = false;
                                    try {
                                        const url = new URL(img.url);
                                        isValidUrl = url.protocol === 'http:' || url.protocol === 'https:';
                                    } catch {
                                        isValidUrl = false;
                                    }

                                    return (
                                        <div
                                            key={img.id || index}
                                            className="relative aspect-square bg-gray-100 border-4 border-black rounded-xl overflow-hidden shadow-[4px_4px_0px_#000]"
                                        >
                                            {isValidUrl ? (
                                                <Image
                                                    src={img.url}
                                                    alt={img.alt || `Product image ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    Invalid URL
                                                </div>
                                            )}
                                            {index === 0 && (
                                                <span className="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 border-2 border-black rounded">
                                                    Main
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-sm text-gray-500 mt-4">
                                Note: Image management is currently available via the product creation API.
                                Images can be added by including them in the product payload during creation.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* SEO Settings */}
                <Card shadow="md">
                    <CardHeader>
                        <CardTitle>SEO</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block font-bold text-sm mb-2">Meta Title</label>
                            <Input
                                {...register('seoTitle')}
                                placeholder="Custom title for search engines"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty to use product title</p>
                        </div>

                        <div>
                            <label className="block font-bold text-sm mb-2">Meta Description</label>
                            <Textarea
                                {...register('seoDescription')}
                                rows={2}
                                placeholder="Description for search engines (150-160 characters ideal)"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Variants Info (Read-only) */}
                {product.variants && product.variants.length > 0 && (
                    <Card shadow="md">
                        <CardHeader>
                            <CardTitle>Variants ({product.variants.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {product.variants.map((v: any) => (
                                    <div key={v.id} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg border-2 border-black">
                                        <span className="font-bold">{v.title}</span>
                                        <div className="flex gap-4 text-sm">
                                            <span>${v.price}</span>
                                            <span>Stock: {v.inventoryQty}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                    <Button
                        type="submit"
                        disabled={updateProduct.isPending}
                        className="flex-1"
                    >
                        {updateProduct.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/admin/products">Cancel</Link>
                    </Button>
                </div>
            </form>
        </div>
    );
}
