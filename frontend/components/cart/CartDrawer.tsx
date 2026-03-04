'use client'

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react"
import { useCartStore } from "@/lib/cart"
import { cn, formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function CartDrawer() {
    const { cart, isOpen, closeCart, isLoading, updateItemQuantity, removeItem } = useCartStore()

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeCart()
        }
        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
            document.body.style.overflow = "hidden"
        }
        return () => {
            document.removeEventListener("keydown", handleEscape)
            document.body.style.overflow = ""
        }
    }, [isOpen, closeCart])

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 z-50 transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
                )}
                onClick={closeCart}
            />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed top-0 right-0 h-full w-full max-w-md bg-secondary z-50 border-l-4 border-black transition-transform duration-300 ease-out flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full",
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-4 border-black bg-primary">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black text-primary rounded-lg flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl uppercase tracking-tight">Your Cart</h2>
                            <p className="text-sm font-bold">{cart?.itemCount || 0} items</p>
                        </div>
                    </div>
                    <Button
                        onClick={closeCart}
                        variant="ghost"
                        size="icon"
                        className="border-4 border-black bg-secondary hover:bg-black hover:text-secondary rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Cart Content */}
                {!cart || cart.items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-6">
                            <ShoppingBag className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="font-black text-2xl mb-2">Cart is Empty</h3>
                        <p className="text-gray-600 mb-6">Add some brutal items to get started</p>
                        <Button
                            onClick={closeCart}
                            asChild
                            className="bg-black text-secondary hover:bg-gray-800 border-4 border-black rounded-lg px-6 py-3 font-bold shadow-[4px_4px_0px_0px_#FACC15] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                        >
                            <Link href="/products">
                                Start Shopping
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {cart.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-lg border-4 border-black p-2.5 shadow-[4px_4px_0px_0px_#000]"
                                >
                                    <div className="flex gap-3">
                                        {/* Image */}
                                        <Link
                                            href={`/products/${item.product.slug}`}
                                            onClick={closeCart}
                                            className="w-16 h-16 shrink-0 rounded-md border-2 border-black overflow-hidden relative bg-gray-100"
                                        >
                                            {item.product.image ? (
                                                <Image
                                                    src={item.product.image || "/placeholder.svg"}
                                                    alt={item.product.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingBag className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </Link>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <Link
                                                    href={`/products/${item.product.slug}`}
                                                    onClick={closeCart}
                                                    className="font-bold text-xs hover:text-red-500 transition-colors line-clamp-1"
                                                >
                                                    {item.product.title}
                                                </Link>
                                                {item.variant.title !== "Default" && (
                                                    <p className="text-[10px] text-gray-600">
                                                        {item.variant.options.map((o) => o.value).join(" / ")}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mt-1">
                                                {/* Quantity - compact */}
                                                <div className="flex items-center border-2 border-black rounded-md overflow-hidden">
                                                    <button
                                                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                                        disabled={isLoading || item.quantity <= 1}
                                                        className="p-1 hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-6 text-center font-black text-xs bg-white">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                                        disabled={isLoading || item.quantity >= item.variant.inventoryQty}
                                                        className="p-1 hover:bg-primary transition-colors disabled:opacity-50"
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>

                                                <p className="font-black text-sm">{formatPrice(item.lineTotal)}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeItem(item.id)}
                                            disabled={isLoading}
                                            className="self-start p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                            aria-label="Remove item"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer - More compact footer */}
                        <div className="border-t-4 border-black p-3 bg-white">
                            {/* Free Shipping Progress - Smaller padding */}
                            <div className="mb-3 p-2 bg-primary/30 rounded-lg border-2 border-black">
                                {cart.subtotal >= 75 ? (
                                    <p className="text-xs font-bold text-center">
                                        You qualify for <span className="text-green-600">FREE SHIPPING</span>!
                                    </p>
                                ) : (
                                    <p className="text-xs font-bold text-center">
                                        Add <span className="text-red-500">{formatPrice(75 - cart.subtotal)}</span> more for FREE shipping
                                    </p>
                                )}
                            </div>

                            {/* Totals - Condensed spacing */}
                            <div className="space-y-1 mb-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-bold">{formatPrice(cart.subtotal)}</span>
                                </div>
                                <div className="flex justify-between pt-1 border-t-2 border-black">
                                    <span className="font-bold text-sm">Total</span>
                                    <span className="font-black text-base">{formatPrice(cart.subtotal)}</span>
                                </div>
                            </div>

                            {/* Buttons - Smaller buttons */}
                            <Button
                                asChild
                                className="w-full bg-black text-secondary hover:bg-gray-800 border-4 border-black rounded-lg py-4 font-black text-sm shadow-[4px_4px_0px_0px_#FACC15] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#FACC15] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#FACC15] transition-all duration-200"
                            >
                                <Link href="/checkout" onClick={closeCart}>
                                    Checkout
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                            <Button
                                onClick={closeCart}
                                asChild
                                variant="outline"
                                className="w-full mt-2 border-4 border-black rounded-lg py-3 font-bold text-sm hover:bg-primary hover:text-black shadow-[4px_4px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#000] transition-all duration-200 bg-transparent"
                            >
                                <Link href="/products">Continue Shopping</Link>
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}
