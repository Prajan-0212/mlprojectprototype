import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Layers, Activity, Cpu, Wallet, SlidersHorizontal, MessageSquareText } from "lucide-react";
import { LOAN_TYPES } from "@/lib/loan";
import { MODEL } from "@/lib/model";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LoanLens — Multi-Loan Readiness, Risk & Decision Support" },
      { name: "description", content: "Choose the right loan, understand your readiness and plan before you apply. Affordability, risk and an explainable ML prediction." },
      { property: "og:title", content: "LoanLens — Multi-Loan Readiness, Risk & Decision Support" },
      { property: "og:description", content: "Choose the right loan, understand your readiness and plan before you apply." },
    ],
  }),
  component: Home,
});

const FEATURES = [
  { icon: Layers, title: "Multiple loan types", body: "Six loan types, each with its own questions and checks." },
  { icon: Activity, title: "Financial analysis", body: "Income, expenses, EMIs, savings and stability in one view." },
  { icon: Cpu, title: "ML prediction", body: "A Random Forest trained on historical applications, run on your profile." },
  { icon: Wallet, title: "Loan affordability", body: "EMI burden, monthly surplus and a comfortable loan range." },
  { icon: SlidersHorizontal, title: "What-if simulation", body: "Move amount, tenure or income and watch everything recalculate." },
  { icon: MessageSquareText, title: "Explainable results", body: "See exactly which inputs pushed the prediction up or down." },
];

const STEPS = ["Select a loan", "Describe your finances", "Analyse affordability", "Predict & explain", "Explore scenarios"];

function Home() {
  return (
    <div>
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="grid-paper absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          <div className="eyebrow rise text-highlight">Multi-loan readiness · risk · decision support</div>
          <h1 className="rise mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.05] sm:text-6xl">
            Choose the right loan. Understand your readiness. <span className="text-highlight">Plan before you apply.</span>
          </h1>
          <p className="rise mt-6 max-w-xl text-base text-ink-foreground/75">
            LoanLens looks at your whole financial picture — not just a credit score — to show whether a loan is affordable, what the risks are, and what you can improve.
          </p>
          <div className="rise mt-8 flex flex-wrap gap-3">
            <Link to="/analyze" className="inline-flex items-center gap-2 rounded-md bg-highlight px-5 py-3 text-sm font-semibold text-ink hover:opacity-90">
              Check my loan readiness <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/analyze" search={{ demo: true }} className="inline-flex items-center rounded-md border border-ink-foreground/25 px-5 py-3 text-sm font-medium hover:bg-ink-foreground/10">
              Try demo
            </Link>
          </div>
          <ol className="mt-14 grid gap-px overflow-hidden rounded-lg border border-ink-foreground/15 bg-ink-foreground/15 sm:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s} className="bg-ink px-4 py-4">
                <div className="num text-xs text-highlight">0{i + 1}</div>
                <div className="mt-1 text-sm">{s}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="panel p-5">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <div className="eyebrow">Supported loans</div>
            <h2 className="mt-2 font-display text-3xl font-semibold">Questions that fit the loan you need</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              A home loan asks about property value and down payment; a business loan about revenue and debt; an agricultural loan about farm income and seasonality.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              The model reached <span className="num text-foreground">{(MODEL.metrics.accuracy * 100).toFixed(1)}%</span> accuracy on a small held-out test set of {MODEL.metrics.test_size} applications —{" "}
              <Link to="/model" className="text-primary underline underline-offset-4">read what that does and doesn't mean</Link>.
            </p>
          </div>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {Object.values(LOAN_TYPES).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.short}</div>
                </div>
                <span className="num text-xs text-muted-foreground">from {t.rate}% p.a.*</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-10 text-xs text-muted-foreground">*Typical starting rates used as editable defaults, not offers. LoanLens is an academic decision-support prototype, not a lender or credit bureau.</p>
      </section>
    </div>
  );
}
