import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Level, Risk } from "@/lib/loan";

export function Page({ eyebrow, title, intro, actions, children }: { eyebrow?: string; title: string; intro?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{title}</h1>
          {intro && <p className="mt-2 text-muted-foreground">{intro}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, sub, children, className, right }: { title?: string; sub?: string; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={cn("panel p-5 sm:p-6", className)}>
      {(title || right) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "good" | "warn" | "bad" }) {
  return (
    <div className="panel p-4">
      <div className="eyebrow">{label}</div>
      <div className={cn("num mt-1.5 text-xl font-medium sm:text-2xl", tone === "good" && "text-success", tone === "warn" && "text-warning", tone === "bad" && "text-destructive")}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Meter({ value, max = 1, tone }: { value: number; max?: number; tone?: "good" | "warn" | "bad" }) {
  const w = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-all duration-500", tone === "bad" ? "bg-destructive" : tone === "warn" ? "bg-warning" : tone === "good" ? "bg-success" : "bg-primary")} style={{ width: `${w}%` }} />
    </div>
  );
}

export const levelTone = (l: Level): "good" | "warn" | "bad" => (l === "Strong" || l === "Good" ? "good" : l === "Needs Improvement" ? "warn" : "bad");
export const riskTone = (r: Risk | string): "good" | "warn" | "bad" => (r === "Low" ? "good" : r === "Medium" ? "warn" : "bad");

export function Pill({ tone, children }: { tone: "good" | "warn" | "bad" | "neutral"; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
      tone === "good" && "border-success/30 bg-success/10 text-success",
      tone === "warn" && "border-warning/40 bg-warning/15 text-foreground",
      tone === "bad" && "border-destructive/30 bg-destructive/10 text-destructive",
      tone === "neutral" && "border-border bg-muted text-muted-foreground")}>{children}</span>
  );
}

export function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const r = 42, c = 2 * Math.PI * r;
  const tone = score >= 60 ? "text-success" : score >= 40 ? "text-warning" : "text-destructive";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" className="stroke-muted" />
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" strokeLinecap="round" className={cn("stroke-current transition-all duration-700", tone)}
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-4xl font-medium">{score}</span>
        <span className="text-xs text-muted-foreground">of 100</span>
      </div>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-dashed border-border bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel flex flex-col items-center px-6 py-16 text-center">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      <div className="mt-6 flex gap-2">
        <Link to="/analyze" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Start an analysis</Link>
      </div>
    </div>
  );
}

export function Loading() {
  return <div className="mx-auto max-w-6xl px-8 py-10"><div className="h-8 w-64 animate-pulse rounded bg-muted" /><div className="mt-6 h-64 animate-pulse rounded-xl bg-muted" /></div>;
}
