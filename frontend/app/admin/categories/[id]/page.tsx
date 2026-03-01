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

const categorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional(),
    image: z.string().url().optional().or(z.literal('')),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function EditCategoryPage() {
    const router = useRouter();
    const params = useParams();
    const queryClient = useQueryClient();
    const categoryId = params?.id as string;
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { data: category, isLoading } = useQuery({
        queryKey: ['admin', 'category', categoryId],
        queryFn: async () => {
            const res = await api.get(`/categories/${categoryId}`);
            return res.data;
        },
        enabled: !!categoryId,
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        values: category
            ? {
                name: category.name,
                slug: category.slug,
                description: category.description || '',
                image: category.image || '',
            }
            : undefined,
    });

    const updateCategory = useMutation({
        mutationFn: async (data: CategoryFormData) => {
            const res = await api.patch(`/categories/${categoryId}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'category', categoryId] });
            setSuccess('Category updated!');
            setTimeout(() => setSuccess(null), 3000);
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Failed to update category');
        },
    });

    const deleteCategory = useMutation({
        mutationFn: async () => {
            await api.delete(`/categories/${categoryId}`);
        },
        onSuccess: () => {
            router.push('/admin/categories');
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Failed to delete');
        },
    });

    const onSubmit = (data: CategoryFormData) => {
        setError(null);
        updateCategory.mutate(data);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!category) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-black">Category not found</h2>
                <Button variant="outline" asChild className="mt-4">
                    <Link href="/admin/categories">Back</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl">
            <div className="mb-8">
                <Link
                    href="/admin/categories"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Categories
                </Link>
                <div className="flex items-start justify-between">
                    <h1 className="text-3xl font-black">Edit Category</h1>
                    <Button
                        variant="destructive"
                        onClick={() => confirm('Delete?') && deleteCategory.mutate()}
                        disabled={deleteCategory.isPending}
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                    <div className="bg-red-500 text-white p-4 border-4 border-black rounded-xl">{error}</div>
                )}
                {success && (
                    <div className="bg-green-500 text-white p-4 border-4 border-black rounded-xl">{success}</div>
                )}

                <Card shadow="md">
                    <CardHeader>
                        <CardTitle>Category Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block font-bold text-sm mb-2">Name *</label>
                            <Input {...register('name')} />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label className="block font-bold text-sm mb-2">Slug *</label>
                            <Input {...register('slug')} />
                            {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>}
                        </div>
                        <div>
                            <label className="block font-bold text-sm mb-2">Description</label>
                            <Textarea {...register('description')} rows={3} />
                        </div>
                        <div>
                            <label className="block font-bold text-sm mb-2">Image URL</label>
                            <Input {...register('image')} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-4">
                    <Button type="submit" disabled={updateCategory.isPending} className="flex-1">
                        {updateCategory.isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : (
                            <><Save className="w-4 h-4" /> Save Changes</>
                        )}
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/admin/categories">Cancel</Link>
                    </Button>
                </div>
            </form>
        </div>
    );
}
