'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Package, Truck, CheckCircle, Clock, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input } from '@/components/ui';

interface OrderResult {
    id: string;
    orderNumber: string;
    status: string;
    email: string;
    createdAt: string;
    total: number;
    subtotal: number;
    shippingCost: number;
    tax: number;
    items: Array<{
        id: string;
        productTitle: string;
        variantTitle: string;
        productImage: string | null;
        quantity: number;
        price: number;
    }>;
    shippingAddress?: {
        firstName: string;
        lastName: string;
        line1: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
}

const statusSteps = [
    { key: 'PENDING', label: 'Placed', icon: Clock },
    { key: 'PAID', label: 'Paid', icon: CheckCircle },
    { key: 'PROCESSING', label: 'Processing', icon: Package },
    { key: 'SHIPPED', label: 'Shipped', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
];

const statusIndex: Record<string, number> = {
    PENDING: 0,
    PAID: 1,
    CONFIRMED: 1,
    PROCESSING: 2,
    SHIPPED: 3,
    DELIVERED: 4,
};

export default function TrackOrderPage() {
    const [orderNumber, setOrderNumber] = useState('');
    const [email, setEmail] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [order, setOrder] = useState<OrderResult | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!orderNumber.trim() || !email.trim()) {
            setError('Please enter both order number and email');
            return;
        }

        setIsSearching(true);
        setError(null);
        setOrder(null);

        try {
            const response = await api.get(`/orders/number/${encodeURIComponent(orderNumber)}`);
            setOrder(response.data);
        } catch (err: any) {
            if (err.response?.status === 404) {
                setError('Order not found. Please check your order number and email.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setIsSearching(false);
        }
    };

    const currentStatus = order ? (statusIndex[order.status] ?? -1) : -1;
    const isCancelled = order && (order.status === 'CANCELLED' || order.status === 'REFUNDED');

    return (
        <div className="py-12 min-h-screen bg-[#FAFAFA]">
            <div className="container mx-auto px-4 max-w-3xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-yellow-400 border-4 border-black rounded-xl shadow-[6px_6px_0px_#000] flex items-center justify-center mx-auto mb-4">
                        <Package className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black">Track Your Order</h1>
                    <p className="text-gray-600 mt-2">
                        Enter your order number and email to check the status
                    </p>
                </div>

                {/* Search Form */}
                <Card shadow="lg" className="mb-8">
                    <CardContent className="p-6">
                        <form onSubmit={handleSearch}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="font-bold text-sm block mb-2">Order Number</label>
                                    <Input
                                        type="text"
                                        value={orderNumber}
                                        onChange={(e) => setOrderNumber(e.target.value)}
                                        placeholder="e.g., ORD-1234567890"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-sm block mb-2">Email Address</label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500 text-white p-4 border-4 border-black rounded-xl mb-4">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" disabled={isSearching} className="w-full" size="lg">
                                {isSearching ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        Track Order
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Order Result */}
                {order && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        {/* Order Header */}
                        <Card shadow="md">
                            <CardContent className="p-6">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-black">Order #{order.orderNumber}</h2>
                                        <p className="text-gray-600 mt-1">
                                            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    <Badge variant={isCancelled ? 'cancelled' : 'success'} size="lg">
                                        {order.status}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status Timeline */}
                        {!isCancelled && (
                            <Card shadow="md">
                                <CardContent className="p-6">
                                    <h3 className="font-black mb-6">Order Progress</h3>
                                    <div className="flex items-center justify-between relative">
                                        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
                                            <div
                                                className="h-full bg-green-500 transition-all"
                                                style={{ width: `${(currentStatus / (statusSteps.length - 1)) * 100}%` }}
                                            />
                                        </div>

                                        {statusSteps.map((step, index) => {
                                            const Icon = step.icon;
                                            const isComplete = index <= currentStatus;
                                            const isCurrent = index === currentStatus;

                                            return (
                                                <div key={step.key} className="relative z-10 flex flex-col items-center">
                                                    <div className={cn(
                                                        'w-10 h-10 rounded-full border-4 flex items-center justify-center',
                                                        isComplete
                                                            ? 'bg-green-500 border-green-500 text-white'
                                                            : 'bg-white border-gray-300 text-gray-400'
                                                    )}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <span className={cn(
                                                        'text-xs mt-2 text-center',
                                                        isCurrent ? 'font-bold' : 'text-gray-600'
                                                    )}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Items */}
                        <Card shadow="md">
                            <CardHeader>
                                <CardTitle>Items ({order.items.length})</CardTitle>
                            </CardHeader>
                            <div className="divide-y-4 divide-black">
                                {order.items.map((item) => (
                                    <div key={item.id} className="p-6 flex gap-4">
                                        <div className="w-16 h-16 bg-gray-100 border-4 border-black rounded-lg shrink-0 relative overflow-hidden">
                                            {item.productImage ? (
                                                <Image
                                                    src={item.productImage}
                                                    alt={item.productTitle}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-6 h-6 text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold">{item.productTitle}</p>
                                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Summary */}
                        <Card shadow="md">
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span>{formatPrice(order.shippingCost)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax</span>
                                    <span>{formatPrice(order.tax)}</span>
                                </div>
                                <div className="flex justify-between font-black text-lg pt-2 border-t-4 border-black">
                                    <span>Total</span>
                                    <span>{formatPrice(order.total)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* CTA */}
                        <div className="text-center">
                            <Button asChild variant="secondary" size="lg">
                                <Link href="/products">
                                    Continue Shopping
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Help Text */}
                {!order && (
                    <div className="text-center text-gray-600">
                        <p>
                            Can't find your order confirmation email?{' '}
                            <Link href="/account" className="font-bold text-red-500 hover:underline">
                                Sign in to your account
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
