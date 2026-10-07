import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Home, Car, GraduationCap, Briefcase, Sprout, Wallet, type LucideIcon } from "lucide-react";
import { DEMO_LABELS, LOAN_TYPES, PROFILE_FIELDS, defaultProfile, demoProfile, type DemoKind, type FieldDef, type LoanType, type Profile } from "@/lib/loan";
import { useStore } from "@/lib/store";
import { FieldInput } from "@/components/FieldInput";
import { Page } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analyze")({
  validateSearch: z.object({ demo: z.boolean().optional() }),
  head: () => ({
    meta: [
      { title: "New loan analysis — LoanLens" },
      { name: "description", content: "Pick a loan type and describe your finances to get a readiness, affordability and risk analysis." },
      { property: "og:title", content: "New loan analysis — LoanLens" },
      { property: "og:description", content: "Pick a loan type and describe your finances to get a readiness analysis." },
    ],
  }),
  component: Analyze,
});

const ICONS: Record<LoanType, LucideIcon> = { personal: Wallet, home: Home, vehicle: Car, education: GraduationCap, business: Briefcase, agricultural: Sprout };
const STEPS = ["Loan type", "Income & obligations", "About you", "Loan details"];

function validate(step: number, p: Profile, fields: FieldDef[]): Record<string, string> {
  const e: Record<string, string> = {};
  const t = LOAN_TYPES[p.loanType];
  for (const f of fields) {
    const v = p[f.key];
    if (typeof v === "number" && (v < 0 || !Number.isFinite(v))) e[f.key] = "Enter a valid positive number.";
  }
  if (step === 1) {
    const mainKey = p.loanType === "business" ? "revenue" : p.loanType === "agricultural" ? "annualAgriIncome" : "monthlyIncome";
    if (!(p[mainKey] as number)) e[mainKey] = "Income is required for the analysis.";
  }
  if (step === 3) {
    if (p.loanAmount <= 0) e.loanAmount = "Enter the amount you want to borrow.";
    if (p.tenureMonths < 6 || p.tenureMonths > t.maxTenure) e.tenureMonths = `Tenure must be between 6 and ${t.maxTenure} months.`;
    if (p.interestRate < 1 || p.interestRate > 36) e.interestRate = "Use a rate between 1% and 36%.";
    if (t.maxLtv && p.downPayment > p.assetValue) e.downPayment = "Down payment can't exceed the asset value.";
    if (t.maxLtv && p.assetValue <= 0) e.assetValue = "Enter the asset value.";
  }
  return e;
}

function Analyze() {
  const { demo } = Route.useSearch();
  const { setCurrent, saveToHistory } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>(defaultProfile("personal"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const t = LOAN_TYPES[p.loanType];

  const update = (k: keyof Profile, v: unknown) => {
    setP((prev) => {
      const next = { ...prev, [k]: v } as Profile;
      if (t.maxLtv && (k === "assetValue" || k === "downPayment")) next.loanAmount = Math.max(0, next.assetValue - next.downPayment);
      return next;
    });
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const fieldsFor = (s: number): FieldDef[] =>
    s === 1 ? t.income : s === 2 ? PROFILE_FIELDS.filter((f) => t.showEmployment || f.key !== "employmentType") : s === 3 ? t.loan : [];

  const next = () => {
    const e = validate(step, p, fieldsFor(step));
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    if (step < 3) setStep(step + 1);
    else {
      setCurrent(p);
      saveToHistory(p);
      navigate({ to: "/report" });
    }
  };

  const loadDemo = (k: DemoKind) => { setP(demoProfile(p.loanType, k)); setErrors({}); setStep(1); };

  return (
    <Page eyebrow={`Step ${step + 1} of 4`} title={step === 0 ? "Which loan are you considering?" : STEPS[step]}
      intro={step === 0 ? "Questions and analysis adapt to the loan type you choose." : `${t.name} · keep figures approximate — monthly amounts unless noted.`}>
      <ol className="mb-8 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <li key={s}>
            <div className={cn("h-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />
            <div className={cn("mt-2 hidden text-xs sm:block", i === step ? "text-foreground" : "text-muted-foreground")}>{s}</div>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(LOAN_TYPES).map((lt) => {
              const Icon = ICONS[lt.id];
              const active = lt.id === p.loanType;
              return (
                <button key={lt.id} onClick={() => setP(defaultProfile(lt.id))}
                  className={cn("panel relative p-5 text-left transition", active ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40")}>
                  {active && <Check className="absolute right-4 top-4 h-4 w-4 text-primary" />}
                  <Icon className="h-6 w-6 text-primary" />
                  <div className="mt-3 font-semibold">{lt.name}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">{lt.short}</div>
                </button>
              );
            })}
          </div>
          <div className={cn("mt-8 rounded-xl border border-dashed p-5", demo ? "border-primary bg-accent/50" : "border-border")}>
            <div className="eyebrow">Demo mode</div>
            <p className="mt-1 text-sm text-muted-foreground">Fill the form with a labelled sample {t.name.toLowerCase()} profile to see the full flow quickly.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {(Object.keys(DEMO_LABELS) as DemoKind[]).map((k) => (
                <button key={k} onClick={() => loadDemo(k)} className="rounded-lg border border-border bg-card p-3 text-left hover:border-primary/50">
                  <div className="text-sm font-medium">Demo · {DEMO_LABELS[k].title}</div>
                  <div className="text-xs text-muted-foreground">{DEMO_LABELS[k].desc}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {step > 0 && (
        <div className="panel grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          {fieldsFor(step).map((f) => <FieldInput key={f.key} field={f} profile={p} onChange={update} error={errors[f.key]} />)}
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}><ArrowLeft /> Back</Button>
        <Button onClick={next}>{step === 3 ? "Analyse my readiness" : "Continue"} <ArrowRight /></Button>
      </div>
    </Page>
  );
}
