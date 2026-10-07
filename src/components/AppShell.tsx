import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Home, ClipboardList, FileBarChart, SlidersHorizontal, Calculator, Columns3, History, Cpu, ListChecks, ShieldCheck, Menu, X, Moon, Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/analyze", label: "New analysis", icon: ClipboardList },
  { to: "/report", label: "Readiness report", icon: FileBarChart },
  { to: "/simulator", label: "What-if simulator", icon: SlidersHorizontal },
  { to: "/scenarios", label: "Scenario planner", icon: Columns3 },
  { to: "/calculator", label: "EMI calculator", icon: Calculator },
  { to: "/history", label: "History", icon: History },
  { to: "/checklist", label: "Before you apply", icon: ListChecks },
  { to: "/model", label: "Model evaluation", icon: Cpu },
  { to: "/about", label: "Responsible AI", icon: ShieldCheck },
] as const;

function Brand() {
  return (
    <Link to="/" className="flex items-baseline gap-2">
      <span className="font-display text-2xl font-semibold text-sidebar-accent-foreground">LoanLens</span>
      <span className="h-2 w-2 rounded-full bg-sidebar-primary" />
    </Link>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("loanlens.theme", next ? "dark" : "light");
  };
  return (
    <button onClick={toggle} aria-label="Toggle dark mode"
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? path === "/" : path.startsWith(to);
        return (
          <Link key={to} to={to} onClick={onNavigate}
            className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}>
            <Icon className={cn("h-4 w-4", active && "text-sidebar-primary")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar p-5 lg:flex">
        <Brand />
        <p className="mt-1 text-xs text-sidebar-foreground/70">Loan readiness & decision support</p>
        <div className="mt-8 flex-1 overflow-y-auto"><NavList /></div>
        <div className="border-t border-sidebar-border pt-3">
          <ThemeToggle />
          <p className="mt-3 px-3 text-[11px] leading-snug text-sidebar-foreground/60">Academic prototype. Not a bank decision or credit score.</p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 lg:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="text-sidebar-accent-foreground"><Menu className="h-6 w-6" /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar p-5">
            <div className="flex items-center justify-between"><Brand />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-sidebar-accent-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-6 flex-1"><NavList onNavigate={() => setOpen(false)} /></div>
            <ThemeToggle />
          </div>
        </div>
      )}
      <main>{children}</main>
    </div>
  );
}
