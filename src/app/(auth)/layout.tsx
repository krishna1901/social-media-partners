import { Sparkles, Check } from "lucide-react";

const highlights = [
  "AI content studio — hooks, captions, scripts & more",
  "Plan, schedule & publish across every platform",
  "Unified inbox, analytics & competitor intelligence",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -left-10 -top-10 h-64 w-72 rounded-full bg-brand-500/25 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-16 right-1/4 h-64 w-72 rounded-full bg-coral-500/20 blur-[110px]" />
        <div className="bg-grid absolute inset-0 opacity-40" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-coral-500 shadow-lg shadow-brand-500/40 ring-1 ring-white/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-bold tracking-tight">
              SocialFlow <span className="text-brand-400">AI</span>
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Command Center</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
            Your AI-powered content command center.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Plan, create, schedule, and grow — all in one premium workspace built for
            creators, marketers, and agencies.
          </p>
          <ul className="mt-6 space-y-3">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm text-white/80">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-300">
                  <Check className="h-3 w-3" />
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">© 2026 SocialFlow AI. All rights reserved.</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
