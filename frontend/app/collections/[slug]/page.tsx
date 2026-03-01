'use client';

import { useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, Folder, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { useCollection, useProducts } from '@/lib/hooks';
import { ProductCard } from '@/components/product/ProductCard';
import { cn } from '@/lib/utils';

const sortOptions = [
    { label: 'Newest', value: 'createdAt-desc' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Name: A-Z', value: 'title-asc' },
];

function CollectionDetailContent() {
    const params = useParams();
    const slug = params?.slug as string;

    const [sortBy, setSortBy] = useState('createdAt-desc');
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const [sortField, sortOrder] = sortBy.split('-') as ['title' | 'price' | 'createdAt', 'asc' | 'desc'];

    const { data: collection, isLoading: isLoadingCollection } = useCollection(slug);
    const { data: productsData, isLoading: isLoadingProducts } = useProducts({
        page,
        limit: 12,
        collection: slug,
        sort: sortField,
        order: sortOrder,
        ...(minPrice ? { minPrice: parseFloat(minPrice) } : {}),
        ...(maxPrice ? { maxPrice: parseFloat(maxPrice) } : {}),
    });

    const products = productsData?.products || [];
    const pagination = productsData?.pagination;

    if (isLoadingCollection) {
        return (
            <div className="min-h-screen bg-[#FAFAFA]">
                <main className="py-8">
                    <div className="container mx-auto px-4">
                        <div className="animate-pulse">
                            <div className="h-8 w-48 bg-muted rounded-lg mb-6" />
                            <div className="border-4 border-black rounded-2xl overflow-hidden mb-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                <div className="h-64 md:h-80 bg-muted" />
                            </div>
                            <div className="h-10 w-64 bg-muted rounded-lg mb-4" />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!collection) {
        return (
            <div className="min-h-screen bg-[#FAFAFA]">
                <main className="container mx-auto px-4 py-20 text-center">
                    <div className="inline-block bg-white border-4 border-black rounded-2xl p-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <div className="w-20 h-20 mx-auto mb-6 bg-[#FACC15] border-4 border-black rounded-xl flex items-center justify-center">
                            <Folder className="w-10 h-10" />
                        </div>
                        <h1 className="text-3xl font-black mb-2">COLLECTION NOT FOUND</h1>
                        <p className="text-muted-foreground mb-8">The collection you're looking for doesn't exist.</p>
                        <Link
                            href="/collections"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-bold rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
                        >
                            VIEW ALL COLLECTIONS
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            <main className="py-8">
                <div className="container mx-auto px-4">
                    {/* Breadcrumb */}
                    <nav className="mb-6">
                        <Link
                            href="/collections"
                            className="inline-flex items-center gap-2 text-sm font-bold hover:text-[#EF4444] transition-colors group"
                        >
                            <div className="w-8 h-8 bg-white border-4 border-black rounded-lg flex items-center justify-center shadow-[4px_4px_0px_0px_#000] group-hover:shadow-none group-hover:translate-x-[4px] group-hover:translate-y-[4px] transition-all">
                                <ArrowLeft className="w-4 h-4" />
                            </div>
                            <span>Back to Collections</span>
                        </Link>
                    </nav>

                    {/* Collection Header */}
                    <div className="border-4 border-black rounded-2xl overflow-hidden mb-10 shadow-[4px_4px_0px_0px_#000]">
                        <div className="relative h-64 md:h-80 bg-black">
                            {collection.image ? (
                                <Image
                                    src={collection.image}
                                    alt={collection.title}
                                    fill
                                    className="object-cover opacity-70"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                    <Folder className="w-24 h-24 text-muted-foreground" />
                                </div>
                            )}
                            {/* Overlay pattern */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                                <span className="inline-block bg-[#EF4444] text-white font-mono text-xs font-bold px-3 py-1.5 border-4 border-black rounded-lg shadow-[4px_4px_0px_0px_#000] -rotate-2 mb-4">
                                    COLLECTION
                                </span>
                                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
                                    {collection.title.toUpperCase()}
                                </h1>
                                {collection.description && (
                                    <p className="text-white/80 mt-3 max-w-2xl text-lg">{collection.description}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <span className="bg-black text-white font-mono text-sm font-bold px-4 py-2 rounded-lg border-4 border-black">
                                {pagination?.total || products.length} PRODUCTS
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value);
                                        setPage(1);
                                    }}
                                    className="appearance-none bg-white border-4 border-black rounded-xl px-4 py-3 pr-12 font-bold text-sm shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all cursor-pointer focus:outline-none focus:ring-0"
                                >
                                    {sortOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" />
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={cn(
                                    "flex items-center gap-2 border-4 border-black rounded-xl px-4 py-3 font-bold text-sm shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all",
                                    showFilters ? "bg-black text-white" : "bg-[#FACC15]"
                                )}
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                FILTERS
                                {(minPrice || maxPrice) && (
                                    <span className="bg-[#EF4444] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">!</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="mb-8 p-6 bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000]">
                            <h3 className="font-black text-sm uppercase mb-4">Price Range</h3>
                            <div className="flex flex-wrap items-end gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-1">Min Price ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={minPrice}
                                        onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                                        placeholder="0"
                                        className="w-28 h-10 px-3 bg-white border-4 border-black rounded-lg font-bold text-sm focus:outline-none"
                                    />
                                </div>
                                <span className="font-black text-lg pb-1">—</span>
                                <div>
                                    <label className="block text-xs font-bold mb-1">Max Price ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={maxPrice}
                                        onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                                        placeholder="∞"
                                        className="w-28 h-10 px-3 bg-white border-4 border-black rounded-lg font-bold text-sm focus:outline-none"
                                    />
                                </div>
                                {(minPrice || maxPrice) && (
                                    <button
                                        onClick={() => { setMinPrice(''); setMaxPrice(''); setPage(1); }}
                                        className="h-10 px-4 bg-[#EF4444] text-white font-bold text-sm border-4 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Products Grid */}
                    {isLoadingProducts ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="border-4 border-black rounded-2xl bg-white shadow-[4px_4px_0px_0px_#000] animate-pulse overflow-hidden">
                                    <div className="aspect-square bg-muted" />
                                    <div className="p-4 space-y-2">
                                        <div className="h-4 bg-muted rounded w-3/4" />
                                        <div className="h-4 bg-muted rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="inline-block bg-white border-4 border-black rounded-2xl p-12 shadow-[4px_4px_0px_0px_#000]">
                                <Folder className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                <p className="text-xl font-black">No products in this collection</p>
                                <p className="text-muted-foreground mt-2">
                                    Check back soon for new additions
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-12">
                                    {Array.from({ length: pagination.totalPages }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPage(i + 1)}
                                            className={cn(
                                                "w-12 h-12 border-4 border-black rounded-xl font-black text-lg transition-all",
                                                page === i + 1
                                                    ? "bg-black text-white shadow-none"
                                                    : "bg-white shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]",
                                            )}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function CollectionDetailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#FAFAFA]">
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 w-48 bg-muted rounded-lg mb-6" />
                        <div className="border-4 border-black rounded-2xl overflow-hidden mb-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <div className="h-64 md:h-80 bg-muted" />
                        </div>
                    </div>
                </div>
            </div>
        }>
            <CollectionDetailContent />
        </Suspense>
    );
}
