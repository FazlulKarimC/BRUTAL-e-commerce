"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShoppingBag, Menu, Search, User, X, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/cart"
import { useAuthStore } from "@/lib/auth"

export function SiteHeader() {
  const router = useRouter()
  const { cart, toggleCart } = useCartStore()
  const { isAuthenticated, user } = useAuthStore()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery("")
    }
  }

  // Close search on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false)
        setSearchQuery("")
        setIsMobileMenuOpen(false)
      }
    }
    if (isSearchOpen || isMobileMenuOpen) {
      window.addEventListener("keydown", handleEscape)
    }
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isSearchOpen, isMobileMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const navLinks = [
    { href: "/products", label: "Shop" },
    { href: "/collections", label: "Collections" },
    { href: "/categories", label: "Categories" },
    { href: "/about", label: "About" },
    { href: "/track", label: "Track Order" },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 bg-secondary border-b-4 border-black">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="font-mono text-2xl font-bold tracking-tighter">
              BRUTAL<span className="text-primary">.</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 font-bold text-sm uppercase tracking-wide hover:bg-black hover:text-secondary transition-colors border-2 border-transparent hover:border-black rounded-lg"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              {isSearchOpen ? (
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-40 md:w-64 h-9 px-3 bg-white border-2 border-black rounded-lg font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="border-2 border-black bg-black text-white hover:bg-yellow-400 hover:text-black rounded-lg"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsSearchOpen(false)
                      setSearchQuery("")
                    }}
                    className="border-2 border-transparent hover:border-black hover:bg-black hover:text-white rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                  className="border-2 border-transparent hover:border-black hover:bg-black hover:text-white rounded-lg"
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="border-2 border-transparent hover:border-black hover:bg-black hover:text-white rounded-lg"
              >
                <Link href={isAuthenticated ? "/account" : "/auth/login"}>
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              {/* Admin Panel Button - Only for Admin/Staff */}
              {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="border-2 border-transparent hover:border-black hover:bg-black hover:text-white rounded-lg"
                  title="Admin Panel"
                >
                  <Link href="/admin">
                    <Shield className="h-5 w-5" />
                  </Link>
                </Button>
              )}
              <Button
                variant="default"
                size="icon"
                onClick={toggleCart}
                className="relative border-2 border-black shadow-xs hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-lg"
              >
                <ShoppingBag className="h-5 w-5" />
                {cart && cart.itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-secondary text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {cart.itemCount}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden border-2 border-transparent hover:border-black rounded-lg"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-60 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-out Menu */}
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-secondary border-l-4 border-black shadow-[-8px_0px_0px_0px_#000] animate-in slide-in-from-right duration-300">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b-4 border-black">
              <span className="font-mono text-xl font-bold">MENU</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="border-2 border-black bg-white rounded-lg shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Menu Links */}
            <nav className="p-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 font-bold text-lg uppercase tracking-wide bg-white border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Menu Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t-4 border-black bg-[#FACC15] space-y-2">
              {/* Admin Panel Link - Only for Admin/Staff */}
              {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 font-bold text-lg uppercase tracking-wide bg-red-500 text-white border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  <Shield className="h-5 w-5" />
                  Admin Panel
                </Link>
              )}
              <Link
                href={isAuthenticated ? "/account" : "/auth/login"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 font-bold text-lg uppercase tracking-wide bg-black text-white border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_#FACC15] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                <User className="h-5 w-5" />
                {isAuthenticated ? "My Account" : "Sign In"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

