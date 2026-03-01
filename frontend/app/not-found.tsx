import Link from 'next/link';
import { Home, ArrowLeft, Search, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui';

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center py-20 bg-[#FAFAFA]">
            <div className="container max-w-2xl px-4 text-center">
                {/* Giant 404 */}
                <div className="relative mb-8">
                    <h1 className="text-[12rem] md:text-[16rem] font-black leading-none tracking-tighter select-none">
                        <span className="relative inline-block">
                            <span className="text-yellow-400 [-webkit-text-stroke:4px_black]">4</span>
                        </span>
                        <span className="relative inline-block mx-2">
                            <span className="text-red-500 [-webkit-text-stroke:4px_black]">0</span>
                        </span>
                        <span className="relative inline-block">
                            <span className="text-yellow-400 [-webkit-text-stroke:4px_black]">4</span>
                        </span>
                    </h1>

                    {/* Decorative elements */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-black rounded-full border-4 border-black flex items-center justify-center rotate-12 shadow-[8px_8px_0px_#FACC15]">
                        <Search className="w-16 h-16 text-white" />
                    </div>
                </div>

                {/* Message Card */}
                <div className="bg-white border-4 border-black rounded-xl p-8 shadow-[8px_8px_0px_#000] mb-8">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">
                        Page Not Found
                    </h2>
                    <p className="text-lg text-gray-600 mb-2">
                        Oops! The page you're looking for seems to have wandered off.
                    </p>
                    <p className="text-gray-500">
                        Maybe it's hiding in a collection somewhere?
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg">
                        <Link href="/">
                            <Home className="w-5 h-5" />
                            Back to Home
                        </Link>
                    </Button>

                    <Button asChild variant="yellow" size="lg">
                        <Link href="/products">
                            <ShoppingBag className="w-5 h-5" />
                            Browse Products
                        </Link>
                    </Button>
                </div>

                {/* Fun Quote */}
                <div className="mt-12 inline-block bg-yellow-400 border-4 border-black rounded-xl px-6 py-3 -rotate-1 shadow-[4px_4px_0px_#000]">
                    <p className="font-mono font-bold text-sm uppercase">
                        "Not all who wander are lost... but this page is."
                    </p>
                </div>

                {/* Quick Links */}
                <div className="mt-12 pt-8 border-t-4 border-black">
                    <p className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-4">
                        Popular Destinations
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        {[
                            { label: 'New Arrivals', href: '/collections/new-arrivals' },
                            { label: 'Collections', href: '/collections' },
                            { label: 'Categories', href: '/categories' },
                        ].map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-4 py-2 bg-white border-4 border-black rounded-lg font-bold text-sm hover:bg-yellow-400 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000] transition-all"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
