'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';
import { Button, Card, CardContent, CardHeader, CardTitle, QuantityStepper } from '@/components/ui';

export default function CartPage() {
  const { cart, isLoading, updateItemQuantity, removeItem } = useCartStore();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 border-4 border-black rounded-xl shadow-[6px_6px_0px_#000] flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-4xl font-black mb-2">Your Cart is Empty</h1>
          <p className="text-gray-600 text-lg mb-8">
            Add some items to get started
          </p>
          <Button asChild size="lg">
            <Link href="/products">
              Start Shopping
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 min-h-screen bg-[#FAFAFA]">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-black mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <Card key={item.id} shadow="md">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Image */}
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="w-28 h-28 shrink-0 border-4 border-black rounded-lg overflow-hidden relative bg-gray-100"
                    >
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-4">
                        <div>
                          <Link
                            href={`/products/${item.product.slug}`}
                            className="font-bold text-lg hover:text-red-500 transition-colors"
                          >
                            {item.product.title}
                          </Link>
                          {item.variant.title !== 'Default' && (
                            <p className="text-gray-600 mt-1">
                              {item.variant.options.map((o) => o.value).join(' / ')}
                            </p>
                          )}
                          {item.variant.sku && (
                            <p className="text-sm text-gray-500">
                              SKU: {item.variant.sku}
                            </p>
                          )}
                        </div>
                        <p className="font-black text-lg whitespace-nowrap">
                          {formatPrice(item.lineTotal)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity */}
                        <QuantityStepper
                          value={item.quantity}
                          onChange={(qty) => updateItemQuantity(item.id, qty)}
                          max={item.variant.inventoryQty}
                          disabled={isLoading}
                          size="sm"
                        />

                        {/* Remove */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          disabled={isLoading}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card shadow="lg" className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Subtotal ({cart.itemCount} items)
                  </span>
                  <span className="font-bold">{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-500">Calculated at checkout</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-500">Calculated at checkout</span>
                </div>

                <div className="border-t-4 border-black pt-4">
                  <div className="flex justify-between text-xl">
                    <span className="font-bold">Estimated Total</span>
                    <span className="font-black">{formatPrice(cart.subtotal)}</span>
                  </div>
                </div>

                <Button asChild className="w-full" size="lg">
                  <Link href="/checkout">
                    Checkout
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/products">
                    Continue Shopping
                  </Link>
                </Button>

                <p className="text-sm text-center text-gray-600">
                  Free shipping on orders over $75
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
