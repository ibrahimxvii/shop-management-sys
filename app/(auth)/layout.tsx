import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Store,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  {
    icon: Package,
    title: "Smart Inventory",
    description: "Real-time stock tracking with low-inventory alerts",
  },
  {
    icon: ShoppingCart,
    title: "Order Management",
    description: "Process orders faster with automated workflows",
  },
  {
    icon: Users,
    title: "Customer Insights",
    description: "Understand your customers with detailed analytics",
  },
  {
    icon: BarChart3,
    title: "Business Reports",
    description: "Make data-driven decisions with live dashboards",
  },
];

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Reset-password is excluded from this check — see middleware.ts
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex">
      {/* ─── Left branding panel (desktop only) ──────────────────── */}
      <aside
        className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between p-10 xl:p-12 relative overflow-hidden flex-shrink-0"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.22 0.09 265) 0%, oklch(0.18 0.12 258) 60%, oklch(0.13 0.06 262) 100%)",
        }}
        aria-hidden="true"
      >
        {/* Background decoration */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.7 0.18 262), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.6 0.2 250), transparent 70%)" }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-lg"
            tabIndex={-1}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">
              ShopFlow
            </span>
          </Link>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight">
              Everything your shop needs,{" "}
              <span className="text-white/60">in one place.</span>
            </h1>
            <p className="text-base text-white/50 leading-relaxed max-w-xs">
              ShopFlow gives you the tools to manage products, orders,
              customers, and your team — all from a single dashboard.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-4" role="list">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 border border-white/10 mt-0.5">
                  <Icon className="h-4 w-4 text-white/80" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="text-xs text-white/45 mt-0.5 leading-relaxed">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Social proof */}
        <div className="relative z-10">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 space-y-3">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className="h-4 w-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-sm text-white/70 leading-relaxed">
              &ldquo;ShopFlow cut our order processing time in half. We can
              finally focus on growing instead of admin work.&rdquo;
            </blockquote>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                SM
              </div>
              <div>
                <p className="text-xs font-medium text-white">Sarah Mitchell</p>
                <p className="text-[11px] text-white/40">Owner, The Green Leaf</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-white/30">
            Trusted by 2,000+ shop owners worldwide
          </p>
        </div>
      </aside>

      {/* ─── Right form panel ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-h-screen bg-background">
        {/* Mobile header */}
        <header className="lg:hidden h-16 flex items-center px-5 border-b border-border">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">
              ShopFlow
            </span>
          </Link>
        </header>

        {/* Form slot */}
        <main className="flex flex-1 items-center justify-center p-5 sm:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-4 px-5 text-center text-xs text-muted-foreground border-t border-border">
          &copy; {new Date().getFullYear()} ShopFlow &middot;{" "}
          <a href="#" className="hover:text-foreground transition-colors">
            Privacy
          </a>{" "}
          &middot;{" "}
          <a href="#" className="hover:text-foreground transition-colors">
            Terms
          </a>
        </footer>
      </div>
    </div>
  );
}
