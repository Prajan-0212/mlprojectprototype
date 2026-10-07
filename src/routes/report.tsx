import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CheckCircle2, AlertTriangle, Lightbulb, SlidersHorizontal, Columns3, ListChecks } from "lucide-react";
import { analyze, inr, LOAN_TYPES, pct, tenureLabel, type Profile } from "@/lib/loan";
import { predict } from "@/lib/model";
import { useStore } from "@/lib/store";
import { Empty, Loading, Meter, Note, Page, Panel, Pill, ScoreRing, Stat, levelTone, riskTone } from "@/components/kit";
import { ExplanationPanel, PredictionPanel } from "@/components/PredictionPanel";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Loan readiness report — LoanLens" },
      { name: "description", content: "Your loan readiness score, financial health, affordability, ML prediction and personalised suggestions." },
      { property: "og:title", content: "Loan readiness report — LoanLens" },
      { property: "og:description", content: "Readiness score, affordability, ML prediction and suggestions." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { ready, current } = useStore();
  if (!ready) return <Loading />;
  if (!current) return <Page title="Readiness report"><Empty title="No analysis yet" body="Run an analysis to see your readiness score, affordability and prediction." /></Page>;
  return <Report p={current} />;
}

export function Report({ p }: { p: Profile }) {
  const { addScenario } = useStore();
  const a = useMemo(() => analyze(p), [p]);
  const pred = useMemo(() => predict(p), [p]);
  const t = LOAN_TYPES[p.loanType];
  const burdenTone = a.emiBurden <= 0.35 ? "good" : a.emiBurden <= 0.5 ? "warn" : "bad";

  return (
    <Page eyebrow={`${t.name} · ${inr(p.loanAmount)} over ${tenureLabel(p.tenureMonths)}`} title="Your loan readiness report"
      actions={<>
        <Button variant="outline" onClick={() => { addScenario(`${t.name} ${inr(p.loanAmount)} · ${tenureLabel(p.tenureMonths)}`, p); toast.success("Saved to scenario planner"); }}><Columns3 /> Save scenario</Button>
        <Button asChild><Link to="/simulator"><SlidersHorizontal /> Open simulator</Link></Button>
      </>}>
      <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
        <Panel className="flex flex-col items-center justify-center lg:w-72">
          <div className="eyebrow mb-3">Loan readiness score</div>
          <ScoreRing score={a.score} />
          <div className="mt-4 flex gap-2"><Pill tone={levelTone(a.level)}>{a.level}</Pill><Pill tone={riskTone(a.risk)}>{a.risk} risk</Pill></div>
          <p className="mt-4 text-center text-[11px] leading-snug text-muted-foreground">An application-generated educational assessment. Not a CIBIL or official credit score.</p>
        </Panel>
        <div className="grid gap-5 sm:grid-cols-2">
          <Panel title="Main strengths">
            {a.strengths.length ? <ul className="space-y-2.5">{a.strengths.map((s) => <li key={s} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{s}</li>)}</ul>
              : <p className="text-sm text-muted-foreground">No clear strengths yet — see suggestions below.</p>}
          </Panel>
          <Panel title="Main concerns">
            {a.concerns.length ? <ul className="space-y-2.5">{a.concerns.map((s) => <li key={s} className="flex gap-2 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />{s}</li>)}</ul>
              : <p className="text-sm text-muted-foreground">No major concerns found.</p>}
          </Panel>
        </div>
      </div>

      <h2 className="eyebrow mb-3 mt-10">Financial overview</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Monthly income" value={inr(a.income)} hint={p.loanType === "business" ? "Revenue − business costs" : p.loanType === "agricultural" ? "Annual farm income ÷ 12" : undefined} />
        <Stat label="Expenses" value={inr(p.monthlyExpenses)} />
        <Stat label="Existing EMI" value={inr(p.existingEmi)} />
        <Stat label="Left after new EMI" value={inr(a.surplus)} tone={a.surplus < 0 ? "bad" : a.surplus / Math.max(1, a.income) < 0.15 ? "warn" : "good"} />
        <Stat label="Savings" value={inr(p.savings)} hint={`${a.savingsMonths.toFixed(1)} months of outgoings`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Financial indicators">
          <div className="space-y-5">
            {[
              { l: "EMI burden (all EMIs ÷ income)", v: a.emiBurden, tone: burdenTone, note: "Many lenders look for this under 40–50%." },
              { l: "Expense burden", v: a.expenseRatio, tone: a.expenseRatio <= 0.4 ? "good" : a.expenseRatio <= 0.6 ? "warn" : "bad", note: "Household expenses ÷ income" },
              ...(a.ltv !== null ? [{ l: "Loan-to-value", v: a.ltv, tone: a.ltv <= 0.75 ? "good" : a.ltv <= 0.85 ? "warn" : "bad", note: "Loan ÷ asset value" }] : []),
              { l: "Loan readiness", v: a.score / 100, tone: levelTone(a.level), note: a.level },
            ].map((x) => (
              <div key={x.l}>
                <div className="mb-1.5 flex justify-between text-sm"><span>{x.l}</span><span className="num">{pct(x.v)}</span></div>
                <Meter value={x.v} tone={x.tone as "good"} />
                <div className="mt-1 text-xs text-muted-foreground">{x.note}</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Loan affordability" sub={`${inr(p.loanAmount)} at ${p.interestRate}% for ${p.tenureMonths} months`}>
          <div className="grid grid-cols-[1fr_140px] items-center gap-4">
            <div className="space-y-3">
              <div><div className="eyebrow">Estimated EMI</div><div className="num text-3xl">{inr(a.newEmi)}</div></div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-muted-foreground">Total interest</div><div className="num">{inr(a.totalInterest)}</div></div>
                <div><div className="text-muted-foreground">Total repayment</div><div className="num">{inr(a.totalRepayment)}</div></div>
              </div>
            </div>
            <div className="h-[140px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[{ name: "Principal", value: p.loanAmount }, { name: "Interest", value: a.totalInterest }]} dataKey="value" innerRadius={40} outerRadius={64} strokeWidth={0}>
                    <Cell fill="var(--chart-1)" /><Cell fill="var(--chart-2)" />
                  </Pie>
                  <Tooltip formatter={(v: number) => inr(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-5 rounded-lg bg-accent/60 p-4">
            <div className="eyebrow">Estimated comfortable loan range</div>
            <div className="num mt-1 text-2xl">{a.comfortable.high > 0 ? `${inr(a.comfortable.low)} – ${inr(a.comfortable.high)}` : "Not affordable right now"}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {p.loanAmount <= a.comfortable.high ? "Your request falls within this range." : "Your request is above this range."} Keeps all EMIs under 40% of income at your chosen rate and tenure.
            </div>
          </div>
          <div className="mt-3"><Note>Educational estimate only — not an official or bank-approved limit.</Note></div>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <PredictionPanel profile={p} pred={pred} />
        <Panel title="How the readiness score is built" sub="Transparent rule-based points (not machine learning)">
          <ul className="space-y-3">
            {a.parts.map((x) => (
              <li key={x.label}>
                <div className="flex justify-between text-sm"><span>{x.label}</span><span className="num">{x.points.toFixed(0)}/{x.max}</span></div>
                <Meter value={x.points} max={x.max} />
                <div className="mt-0.5 text-xs text-muted-foreground">{x.note}</div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-5"><ExplanationPanel pred={pred} /></div>

      <div className="mt-5">
        <Panel title="What you could improve" right={<Lightbulb className="h-5 w-5 text-highlight" />}>
          <ul className="grid gap-3 sm:grid-cols-2">{a.suggestions.map((s) => <li key={s} className="rounded-lg border border-border p-3 text-sm">{s}</li>)}</ul>
          <p className="mt-4 text-xs text-muted-foreground">Suggestions come from your numbers. No change guarantees approval by any bank.</p>
        </Panel>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link to="/scenarios"><Columns3 /> Compare scenarios</Link></Button>
        <Button variant="outline" asChild><Link to="/checklist"><ListChecks /> Before you apply</Link></Button>
      </div>
    </Page>
  );
}
