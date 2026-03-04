'use client'

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Folder } from "lucide-react"
import { useCollections } from "@/lib/hooks"

// Color palette for collections (cycles through these)
const collectionColors = [
  { color: "bg-secondary", textColor: "" },
  { color: "bg-primary", textColor: "text-white" },
  { color: "bg-black", textColor: "text-white" },
]

export function CollectionsGrid() {
  const { data: collections, isLoading } = useCollections()

  // Take first 3 collections for the grid
  const displayCollections = collections?.slice(0, 3) || []

  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="inline-block bg-black text-secondary font-mono text-sm font-bold px-3 py-1 mb-3 rounded-lg">
              CURATED
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">COLLECTIONS</h2>
          </div>
          <Link
            href="/collections"
            className="hidden md:flex items-center gap-2 font-bold border-b-4 border-black pb-1 hover:border-primary transition-colors"
          >
            VIEW ALL <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Collections Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={`border-4 border-black shadow-md rounded-xl overflow-hidden animate-pulse ${index === 1 ? "md:-translate-y-4" : ""
                  }`}
              >
                <div className="aspect-square bg-gray-200" />
              </div>
            ))}
          </div>
        ) : displayCollections.length === 0 ? (
          <div className="text-center py-20">
            <Folder className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="font-bold text-gray-600">No collections yet</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {displayCollections.map((collection, index) => {
              const colorStyle = collectionColors[index % collectionColors.length]
              return (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.slug}`}
                  className={`group relative border-4 border-black shadow-[4px_4px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_#000] transition-all duration-200 overflow-hidden rounded-xl ${index === 1 ? "md:-translate-y-4 md:hover:-translate-y-5" : ""
                    }`}
                >
                  <div className="aspect-square relative">
                    {collection.image ? (
                      <Image
                        src={collection.image}
                        alt={collection.title}
                        fill
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Folder className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    {/* Solid Color Overlay */}
                    <div className={`absolute inset-0 ${colorStyle.color} opacity-80 mix-blend-multiply`} />

                    {/* Content */}
                    <div
                      className={`absolute inset-0 p-6 flex flex-col justify-between ${colorStyle.textColor || "text-black"}`}
                    >
                      <div className="self-end">
                        <div className="w-12 h-12 border-4 border-current flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors rounded-lg">
                          <ArrowUpRight className="h-6 w-6" />
                        </div>
                      </div>
                      <div>
                        <p className="font-mono text-sm font-bold mb-1">
                          {collection._count?.products || 0} Items
                        </p>
                        <h3 className="text-3xl md:text-4xl font-black tracking-tighter">
                          {collection.title.toUpperCase()}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <Link
          href="/collections"
          className="md:hidden flex items-center justify-center gap-2 font-bold mt-8 py-4 border-4 border-black bg-white shadow-xs rounded-xl"
        >
          VIEW ALL COLLECTIONS <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
