import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative bg-secondary overflow-hidden">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="relative z-10">
            <div className="inline-block bg-primary text-white font-mono text-sm font-bold px-4 py-2 border-4 border-black shadow-md mb-6 -rotate-2 rounded-lg">
              NEW COLLECTION 2025
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-none tracking-tighter mb-6">
              BOLD<span className="text-primary">.</span>
              <br />
              BRUTAL<span className="text-primary">.</span>
              <br />
              <span className="inline-block bg-black text-secondary px-4 py-1 rounded-lg">BEAUTIFUL</span>
            </h1>

            <p className="text-lg md:text-xl font-medium max-w-md mb-8 border-l-4 border-black pl-4">
              Unapologetically bold designs for those who refuse to blend in. Make a statement.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="font-bold text-lg px-8 py-6 border-4 border-black shadow-[4px_4px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_#000] transition-all duration-200 rounded-lg"
              >
                <Link href="/products">
                  SHOP NOW
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="font-bold text-lg px-8 py-6 border-4 border-black bg-white shadow-[4px_4px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#000] hover:bg-yellow-400 active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_#000] transition-all duration-200 rounded-lg"
              >
                <Link href="/collections">
                  EXPLORE
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative bg-white border-4 border-black shadow-lg p-4 rotate-2 hover:rotate-0 transition-transform duration-300 rounded-xl">
              <Image
                src="/hero-fashion-model.png"
                alt="Featured collection model"
                width={500}
                height={600}
                className="w-full h-auto border-4 border-black rounded-lg"
              />
              <div className="absolute -bottom-4 -left-4 bg-primary text-white font-mono font-bold px-4 py-2 border-4 border-black shadow-sm -rotate-6 rounded-lg">
                FROM $89
              </div>
            </div>

            <div className="absolute -top-6 -right-6 w-24 h-24 bg-black hidden lg:block rounded-lg" />
            <div className="absolute -bottom-8 right-12 w-16 h-16 bg-primary border-4 border-black hidden lg:block rounded-lg" />
          </div>
        </div>
      </div>

      {/* Bottom Border Pattern */}
      <div className="h-4 bg-black" />
    </section>
  )
}
