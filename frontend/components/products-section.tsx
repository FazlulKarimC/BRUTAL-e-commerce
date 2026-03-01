'use client'

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Loader2 } from "lucide-react"
import { useProducts } from "@/lib/hooks"
import { useCartStore } from "@/lib/cart"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { useState } from "react"

export function ProductsSection() {
  const { data, isLoading } = useProducts({ limit: 4, featured: true })
  const { addItem } = useCartStore()
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  const products = data?.products || []

  const handleAddToCart = async (e: React.MouseEvent, product: any) => {
    e.preventDefault()
    e.stopPropagation()

    const firstVariant = product.variants?.[0]
    if (!firstVariant) {
      toast.error('No variant available')
      return
    }

    setAddingToCart(product.id)
    try {
      await addItem(firstVariant.id, 1)
      toast.success('Added to cart!', {
        description: product.title,
        icon: '🛒',
      })
    } catch (error) {
      toast.error('Failed to add to cart')
    } finally {
      setAddingToCart(null)
    }
  }

  // Determine badge based on product properties
  const getBadge = (product: any) => {
    if (product.featured) return { text: 'NEW', color: 'bg-secondary' }
    const variant = product.variants?.[0]
    if (variant?.compareAtPrice && variant.compareAtPrice > variant.price) {
      return { text: 'SALE', color: 'bg-primary' }
    }
    return null
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            FEATURED <span className="inline-block bg-secondary px-3 border-4 border-black rounded-lg">DROPS</span>
          </h2>
          <p className="text-muted-foreground font-medium max-w-md mx-auto">
            Our most wanted pieces, curated for the bold.
          </p>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className={`${index % 2 === 1 ? "md:translate-y-4" : ""}`}>
                <div className="border-4 border-black bg-muted shadow-md rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-3/4 bg-gray-200" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-5 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="font-bold text-gray-600">No featured products yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, index) => {
              const badge = getBadge(product)
              const variant = product.variants?.[0]
              const price = variant?.price || 0
              const originalPrice = variant?.compareAtPrice || null
              const isOnSale = originalPrice && originalPrice > price
              const isAdding = addingToCart === product.id
              const imageUrl = product.images?.[0]?.url

              return (
                <div key={product.id} className={`group ${index % 2 === 1 ? "md:translate-y-4" : ""}`}>
                  <Link href={`/products/${product.slug}`}>
                    <div className="relative border-4 border-black bg-muted shadow-md hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all rounded-xl overflow-hidden">
                      {badge && (
                        <div
                          className={`absolute top-3 left-3 z-10 ${badge.color} text-black font-mono text-xs font-bold px-3 py-1 border-2 border-black -rotate-3 rounded-md`}
                        >
                          {badge.text}
                        </div>
                      )}

                      {/* Image */}
                      <div className="aspect-3/4 relative overflow-hidden">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <ShoppingBag className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <Button
                        size="icon"
                        aria-label="Add to cart"
                        disabled={isAdding || !variant}
                        onClick={(e) => handleAddToCart(e, product)}
                        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity border-4 border-black shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none rounded-lg"
                      >
                        {isAdding ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingBag className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </Link>

                  {/* Product Info */}
                  <Link href={`/products/${product.slug}`} className="block mt-4 hover:opacity-80 transition-opacity">
                    <h3 className="font-black text-sm md:text-base">{product.title.toUpperCase()}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono font-bold text-lg">{formatPrice(price)}</span>
                      {isOnSale && originalPrice && (
                        <span className="font-mono text-sm text-muted-foreground line-through">
                          {formatPrice(originalPrice)}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="font-bold text-lg px-12 py-6 border-4 border-black bg-white shadow-md hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none hover:bg-secondary transition-all rounded-xl"
          >
            <Link href="/products">
              VIEW ALL PRODUCTS
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
