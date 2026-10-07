import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Trash2, Wand2, Plus } from "lucide-react";
import { analyze, inr, pct, tenureLabel, LOAN_TYPES } from "@/lib/loan";
import { predict } from "@/lib/model";
import { useStore } from "@/lib/store";
import { Empty, Loading, Page, Panel, Pill, levelTone, riskTone } from "@/components/kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/scenarios")({
  head: () => ({
    meta: [
      { title: "Loan scenario planner — LoanLens" },
      { name: "description", content: "Save and compare loan scenarios side by side: EMI, total repayment, affordability, readiness and risk." },
      { property: "og:title", content: "Loan scenario planner — LoanLens" },
      { property: "og:description", content: "Compare loan scenarios side by side." },
    ],
  }),
  component: Scenarios,
});

function Scenarios() {
  const { ready, current, scenarios, addScenario, removeScenario, clearScenarios } = useStore();
  if (!ready) return <Loading />;

  const generate = () => {
    if (!current) return;
    const max = LOAN_TYPES[current.loanType].maxTenure;
    addScenario(`Current · ${inr(current.loanAmount)} · ${tenureLabel(current.tenureMonths)}`, current);
    const o1 = { ...current, loanAmount: Math.round(current.loanAmount * 0.8 / 10000) * 10000, tenureMonths: Math.min(max, current.tenureMonths + 12) };
    const o2 = { ...current, loanAmount: Math.round(current.loanAmount * 0.6 / 10000) * 10000, tenureMonths: Math.min(max, current.tenureMonths + 24) };
    addScenario(`Option 1 · ${inr(o1.loanAmount)} · ${tenureLabel(o1.tenureMonths)}`, o1);
    addScenario(`Option 2 · ${inr(o2.loanAmount)} · ${tenureLabel(o2.tenureMonths)}`, o2);
    toast.success("Added current plan and two alternatives");
  };

  const rows = scenarios.map((s) => ({ s, a: analyze(s.profile), pr: predict(s.profile) }));

  return (
    <Page eyebrow="Planner" title="Loan scenario planner" intro="Compare up to six scenarios. Every value is calculated from the saved profile."
      actions={<>
        {current && <Button variant="outline" onClick={() => { addScenario(`${LOAN_TYPES[current.loanType].name} ${inr(current.loanAmount)}`, current); }}><Plus /> Add current</Button>}
        {current && <Button onClick={generate}><Wand2 /> Generate alternatives</Button>}
        {scenarios.length > 0 && <Button variant="ghost" onClick={clearScenarios}>Clear all</Button>}
      </>}>
      {rows.length === 0 ? (
        current ? <Panel><p className="text-sm text-muted-foreground">No scenarios saved yet. Use "Generate alternatives" to compare your current plan with smaller, longer options, or save one from the simulator.</p></Panel>
          : <Empty title="No scenarios yet" body="Run an analysis, then save scenarios from your report or the simulator." />
      ) : (
        <>
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-border text-left">
                <tr className="eyebrow">{["Scenario", "Amount", "Tenure", "EMI", "Total repay", "EMI burden", "Readiness", "Risk", "Model", ""].map((h) => <th key={h} className="px-4 py-3 font-normal">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ s, a, pr }) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="num px-4 py-3">{inr(s.profile.loanAmount)}</td>
                    <td className="num px-4 py-3">{tenureLabel(s.profile.tenureMonths)}</td>
                    <td className="num px-4 py-3">{inr(a.newEmi)}</td>
                    <td className="num px-4 py-3">{inr(a.totalRepayment)}</td>
                    <td className="num px-4 py-3">{pct(a.emiBurden)}</td>
                    <td className="px-4 py-3"><span className="num mr-2">{a.score}</span><Pill tone={levelTone(a.level)}>{a.level}</Pill></td>
                    <td className="px-4 py-3"><Pill tone={riskTone(a.risk)}>{a.risk}</Pill></td>
                    <td className="num px-4 py-3">{Math.round(pr.probability * 100)}%</td>
                    <td className="px-4 py-3"><button aria-label="Remove scenario" onClick={() => removeScenario(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Panel title="Monthly EMI">
              <div className="h-56"><ResponsiveContainer><BarChart data={rows.map((r, i) => ({ n: `#${i + 1}`, v: Math.round(r.a.newEmi) }))}>
                <CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="n" stroke="var(--muted-foreground)" fontSize={12} /><YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => inr(v)} width={70} />
                <Tooltip formatter={(v: number) => inr(v)} /><Bar dataKey="v" name="EMI" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart></ResponsiveContainer></div>
            </Panel>
            <Panel title="Readiness score">
              <div className="h-56"><ResponsiveContainer><BarChart data={rows.map((r, i) => ({ n: `#${i + 1}`, v: r.a.score }))}>
                <CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="n" stroke="var(--muted-foreground)" fontSize={12} /><YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip /><Bar dataKey="v" name="Readiness" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart></ResponsiveContainer></div>
            </Panel>
          </div>
        </>
      )}
    </Page>
  );
}
