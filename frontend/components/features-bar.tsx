import { Truck, RotateCcw, Shield, Zap } from "lucide-react"

const features = [
  { icon: Truck, label: "FREE SHIPPING", sublabel: "Orders $100+" },
  { icon: RotateCcw, label: "EASY RETURNS", sublabel: "30 Day Policy" },
  { icon: Shield, label: "SECURE PAY", sublabel: "100% Protected" },
  { icon: Zap, label: "FAST DELIVERY", sublabel: "2-3 Days" },
]

export function FeaturesBar() {
  return (
    <section className="bg-white py-8 border-b-4 border-black">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <div
              key={feature.label}
              className={`flex items-center gap-3 p-4 border-4 border-black bg-background shadow-[4px_4px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_#000] transition-all duration-200 rounded-xl ${index % 2 === 0 ? "rotate-1" : "-rotate-1"
                } hover:rotate-0`}
            >
              <div className="bg-secondary p-3 border-4 border-black rounded-lg">
                <feature.icon className="h-6 w-6" strokeWidth={3} />
              </div>
              <div>
                <p className="font-black text-sm">{feature.label}</p>
                <p className="text-xs text-muted-foreground font-medium">{feature.sublabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
