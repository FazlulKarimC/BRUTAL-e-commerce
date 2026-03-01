'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea } from '@/components/ui';

const collectionSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional(),
    image: z.string().url().optional().or(z.literal('')),
    featured: z.boolean().default(false),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

export default function EditCollectionPage() {
    const router = useRouter();
    const params = useParams();
    const queryClient = useQueryClient();
    const collectionId = params?.id as string;
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { data: collection, isLoading } = useQuery({
        queryKey: ['admin', 'collection', collectionId],
        queryFn: async () => {
            const res = await api.get(`/collections/${collectionId}`);
            return res.data;
        },
        enabled: !!collectionId,
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CollectionFormData>({
        resolver: zodResolver(collectionSchema),
        values: collection
            ? {
                title: collection.title,
                slug: collection.slug,
                description: collection.description || '',
                image: collection.image || '',
                featured: collection.featured,
                seoTitle: collection.seoTitle || '',
                seoDescription: collection.seoDescription || '',
            }
            : undefined,
    });

    const updateCollection = useMutation({
        mutationFn: async (data: CollectionFormData) => {
            const res = await api.patch(`/collections/${collectionId}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'collection', collectionId] });
            setSuccess('Collection updated successfully!');
            setError(null);
            setTimeout(() => setSuccess(null), 3000);
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Failed to update collection');
            setSuccess(null);
        },
    });

    const deleteCollection = useMutation({
        mutationFn: async () => {
            await api.delete(`/collections/${collectionId}`);
        },
        onSuccess: () => {
            router.push('/admin/collections');
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Failed to delete collection');
        },
    });

    const onSubmit = (data: CollectionFormData) => {
        setError(null);
        setSuccess(null);
        updateCollection.mutate(data);
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this collection?')) {
            deleteCollection.mutate();
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!collection) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-black">Collection not found</h2>
                <Button variant="outline" asChild className="mt-4">
                    <Link href="/admin/collections">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Collections
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/admin/collections"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Collections
                </Link>
                <div className="flex items-start justify-between">
                    <h1 className="text-3xl font-black">Edit Collection</h1>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteCollection.isPending}
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

                {success && (
                    <div className="bg-green-500 text-white p-4 border-4 border-black rounded-xl">
                        {success}
                    </div>
                )}

                {/* Basic Info */}
                <Card shadow="md">
                    <CardHeader>
                        <CardTitle>Collection Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block font-bold text-sm mb-2">Title *</label>
                            <Input {...register('title')} />
                            {errors.title && (
                                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block font-bold text-sm mb-2">Slug *</label>
                            <Input {...register('slug')} />
                            {errors.slug && (
                                <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block font-bold text-sm mb-2">Description</label>
                            <Textarea {...register('description')} rows={3} />
                        </div>

                        <div>
                            <label className="block font-bold text-sm mb-2">Image URL</label>
                            <Input {...register('image')} />
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                {...register('featured')}
                                type="checkbox"
                                id="featured"
                                className="w-6 h-6 border-4 border-black rounded accent-yellow-400"
                            />
                            <label htmlFor="featured" className="font-bold">
                                Featured Collection
                            </label>
                        </div>
                    </CardContent>
                </Card>

                {/* SEO */}
                <Card shadow="md">
                    <CardHeader>
                        <CardTitle>SEO</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block font-bold text-sm mb-2">Meta Title</label>
                            <Input {...register('seoTitle')} />
                        </div>

                        <div>
                            <label className="block font-bold text-sm mb-2">Meta Description</label>
                            <Textarea {...register('seoDescription')} rows={2} />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-4">
                    <Button
                        type="submit"
                        disabled={updateCollection.isPending}
                        className="flex-1"
                    >
                        {updateCollection.isPending ? (
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
                        <Link href="/admin/collections">Cancel</Link>
                    </Button>
                </div>
            </form>
        </div>
    );
}
