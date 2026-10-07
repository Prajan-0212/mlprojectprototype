import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RotateCcw, ArrowRight } from "lucide-react";
import { analyze, inr, LOAN_TYPES, pct, type Profile } from "@/lib/loan";
import { predict } from "@/lib/model";
import { useStore } from "@/lib/store";
import { Empty, Loading, Page, Panel, Pill, ScoreRing, levelTone, riskTone } from "@/components/kit";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "What-if loan simulator — LoanLens" },
      { name: "description", content: "Change loan amount, tenure, income, EMIs or down payment and see readiness, risk and prediction recalculate live." },
      { property: "og:title", content: "What-if loan simulator — LoanLens" },
      { property: "og:description", content: "See how changing your loan changes readiness, risk and prediction." },
    ],
  }),
  component: SimulatorPage,
});

function SimulatorPage() {
  const { ready, current } = useStore();
  if (!ready) return <Loading />;
  if (!current) return <Page title="What-if loan simulator"><Empty title="Nothing to simulate yet" body="Run an analysis first — the simulator starts from your profile." /></Page>;
  return <Simulator base={current} />;
}

function incomeKey(p: Profile): keyof Profile {
  return p.loanType === "business" ? "revenue" : p.loanType === "agricultural" ? "annualAgriIncome" : "monthlyIncome";
}

function Simulator({ base }: { base: Profile }) {
  const { addScenario } = useStore();
  const [p, setP] = useState(base);
  useEffect(() => setP(base), [base]);
  const t = LOAN_TYPES[p.loanType];
  const a0 = useMemo(() => analyze(base), [base]);
  const pr0 = useMemo(() => predict(base), [base]);
  const a = useMemo(() => analyze(p), [p]);
  const pr = useMemo(() => predict(p), [p]);
  const ik = incomeKey(p);
  const set = (k: keyof Profile, v: number) => setP((prev) => {
    const n = { ...prev, [k]: v } as Profile;
    if (k === "downPayment" && t.maxLtv) n.loanAmount = Math.max(0, n.assetValue - v);
    return n;
  });

  const sliders: { k: keyof Profile; label: string; min: number; max: number; step: number; fmt: (n: number) => string }[] = [
    { k: ik, label: ik === "annualAgriIncome" ? "Annual farm income" : ik === "revenue" ? "Monthly revenue" : "Monthly income", min: 0, max: Math.max(10000, (base[ik] as number) * 2.5), step: 1000, fmt: inr },
    { k: "loanAmount", label: "Loan amount", min: 10000, max: Math.max(100000, base.loanAmount * 2, base.assetValue), step: 10000, fmt: inr },
    { k: "tenureMonths", label: "Tenure", min: 6, max: t.maxTenure, step: 6, fmt: (n) => `${n} months` },
    { k: "existingEmi", label: "Existing EMI", min: 0, max: Math.max(20000, base.existingEmi * 3), step: 500, fmt: inr },
    { k: "interestRate", label: "Interest rate", min: 4, max: 24, step: 0.25, fmt: (n) => `${n}%` },
    ...(t.maxLtv ? [{ k: "downPayment" as const, label: "Down payment", min: 0, max: base.assetValue, step: 10000, fmt: inr }] : []),
  ];

  const Delta = ({ now, was, fmt, good }: { now: number; was: number; fmt: (n: number) => string; good: "up" | "down" }) => {
    const d = now - was;
    if (Math.abs(d) < 1e-6) return <span className="text-xs text-muted-foreground">no change</span>;
    const better = good === "up" ? d > 0 : d < 0;
    return <span className={cn("num text-xs", better ? "text-success" : "text-destructive")}>{d > 0 ? "▲" : "▼"} {fmt(Math.abs(d))}</span>;
  };

  return (
    <Page eyebrow={t.name} title="What-if loan simulator" intro="Move the sliders — every figure below is recalculated from your profile, including the model prediction."
      actions={<>
        <Button variant="outline" onClick={() => setP(base)}><RotateCcw /> Reset</Button>
        <Button onClick={() => { addScenario(`What-if · ${inr(p.loanAmount)} · ${p.tenureMonths}m`, p); toast.success("Scenario saved"); }}>Save as scenario</Button>
      </>}>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Panel title="Adjust">
          <div className="space-y-6">
            {sliders.map((s) => (
              <div key={s.k}>
                <div className="mb-2 flex justify-between text-sm"><span>{s.label}</span><span className="num">{s.fmt(p[s.k] as number)}</span></div>
                <Slider min={s.min} max={s.max} step={s.step} value={[p[s.k] as number]} onValueChange={([v]) => set(s.k, v)} />
              </div>
            ))}
          </div>
        </Panel>
        <div className="space-y-5">
          <Panel>
            <div className="flex flex-wrap items-center gap-6">
              <ScoreRing score={a.score} size={130} />
              <div className="space-y-2">
                <div className="eyebrow">Readiness</div>
                <div className="flex gap-2"><Pill tone={levelTone(a.level)}>{a.level}</Pill><Pill tone={riskTone(a.risk)}>{a.risk} risk</Pill></div>
                <Delta now={a.score} was={a0.score} fmt={(n) => `${n} pts`} good="up" />
                <div className="text-xs text-muted-foreground">Was {a0.score} · {a0.level} · {a0.risk} risk</div>
              </div>
            </div>
          </Panel>
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "Monthly EMI", v: inr(a.newEmi), d: <Delta now={a.newEmi} was={a0.newEmi} fmt={inr} good="down" /> },
              { l: "EMI burden", v: pct(a.emiBurden), d: <Delta now={a.emiBurden * 100} was={a0.emiBurden * 100} fmt={(n) => `${n.toFixed(0)} pts`} good="down" /> },
              { l: "Left each month", v: inr(a.surplus), d: <Delta now={a.surplus} was={a0.surplus} fmt={inr} good="up" /> },
              { l: "Total interest", v: inr(a.totalInterest), d: <Delta now={a.totalInterest} was={a0.totalInterest} fmt={inr} good="down" /> },
            ].map((x) => (
              <div key={x.l} className="panel p-4"><div className="eyebrow">{x.l}</div><div className="num mt-1 text-xl">{x.v}</div>{x.d}</div>
            ))}
          </div>
          <Panel title="Model prediction">
            <div className="flex items-baseline justify-between">
              <span className={cn("font-display text-2xl font-semibold", pr.approved ? "text-success" : "text-destructive")}>{pr.approved ? "Likely approved" : "Likely rejected"}</span>
              <span className="num text-2xl">{Math.round(pr.probability * 100)}%</span>
            </div>
            <Delta now={pr.probability * 100} was={pr0.probability * 100} fmt={(n) => `${n.toFixed(1)} pts`} good="up" />
            <p className="mt-2 text-xs text-muted-foreground">Comfortable range now: <span className="num">{inr(a.comfortable.low)} – {inr(a.comfortable.high)}</span>. {t.modelSupport === "indicative" && "Prediction is indicative only for this loan type."}</p>
          </Panel>
          <Link to="/scenarios" className="inline-flex items-center gap-1 text-sm text-primary">Compare saved scenarios <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </Page>
  );
}
