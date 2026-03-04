import Link from 'next/link';
import { Heart, Leaf, Truck, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            {/* Hero Section */}
            <section className="bg-yellow-400 border-b-4 border-black py-20">
                <div className="container mx-auto max-w-5xl px-4 text-center">
                    <div className="inline-block bg-black text-white px-4 py-2 rounded-lg border-4 border-black mb-6 -rotate-2 shadow-[4px_4px_0px_#FACC15]">
                        <span className="font-mono text-sm font-bold uppercase tracking-wider">Est. 2020</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                        BOLD DESIGNS FOR{' '}
                        <span className="relative inline-block">
                            <span className="relative z-10">BOLD PEOPLE</span>
                            <span className="absolute bottom-1 left-0 right-0 h-4 bg-red-500 z-0 -rotate-1"></span>
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
                        We believe fashion should make a statement. Raw, unapologetic, and distinctly you.
                    </p>
                </div>
            </section>

            {/* Our Story Section */}
            <section className="py-20">
                <div className="container mx-auto max-w-5xl px-4">
                    <div className="bg-white border-4 border-black rounded-xl shadow-[8px_8px_0px_#000] p-8 md:p-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-yellow-400 border-4 border-black rounded-lg flex items-center justify-center shadow-[4px_4px_0px_#000]">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Our Story</h2>
                        </div>

                        <div className="space-y-6 text-lg leading-relaxed text-gray-700">
                            <p>
                                <strong className="text-black">BRUTAL</strong> was born from a simple idea: fashion doesn't need to follow rules.
                                In a world of safe choices and muted tones, we chose to stand out.
                            </p>
                            <p>
                                Our neo-brutalist approach combines bold aesthetics with high-quality materials.
                                Every piece is designed to make you feel confident, powerful, and unmistakably <em>you</em>.
                            </p>
                            <p>
                                From our studio in the heart of the city, we craft garments that challenge conventions
                                and celebrate individuality. No compromises. No apologies.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-16 bg-black text-white">
                <div className="container mx-auto max-w-5xl px-4">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-center mb-12">
                        What We <span className="text-yellow-400">Stand For</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            {
                                icon: Heart,
                                title: 'Authentic Expression',
                                description: 'We create for those who dare to be different. Every design celebrates individuality.',
                                color: 'bg-red-500',
                            },
                            {
                                icon: Leaf,
                                title: 'Sustainable Practices',
                                description: 'Quality over quantity. We craft pieces meant to last, reducing fashion waste.',
                                color: 'bg-yellow-400 text-black',
                            },
                            {
                                icon: Truck,
                                title: 'Global Community',
                                description: 'We ship worldwide, connecting bold individuals across the globe.',
                                color: 'bg-white text-black',
                            },
                            {
                                icon: Shield,
                                title: 'Quality Guaranteed',
                                description: "Premium materials, expert craftsmanship. If you're not happy, we'll make it right.",
                                color: 'bg-red-500',
                            },
                        ].map((value, index) => (
                            <div
                                key={value.title}
                                className="bg-white text-black border-4 border-white rounded-xl p-6 shadow-[4px_4px_0px_#FACC15] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#FACC15] transition-all duration-200"
                            >
                                <div className={`w-12 h-12 ${value.color} border-4 border-black rounded-lg flex items-center justify-center mb-4 shadow-[2px_2px_0px_#000]`}>
                                    <value.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tight mb-2">{value.title}</h3>
                                <p className="text-gray-600 font-medium">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="container mx-auto max-w-3xl px-4 text-center">
                    <div className="bg-yellow-400 border-4 border-black rounded-xl p-8 md:p-12 shadow-[8px_8px_0px_#000] -rotate-1">
                        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">
                            Ready to Stand Out?
                        </h2>
                        <p className="text-lg font-medium mb-8">
                            Join thousands who've chosen to express themselves boldly.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild size="lg">
                                <Link href="/products">
                                    Shop Now
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </Button>
                            <Button asChild variant="yellow" size="lg">
                                <Link href="/collections">
                                    View Collections
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Fun Quote */}
            <section className="py-12 border-t-4 border-black">
                <div className="container mx-auto max-w-3xl px-4 text-center">
                    <div className="inline-block bg-black text-white px-6 py-4 rounded-xl border-4 border-black rotate-1 shadow-[4px_4px_0px_#FACC15]">
                        <p className="font-mono font-bold text-lg">
                            "In a world of whispers, we choose to shout."
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
