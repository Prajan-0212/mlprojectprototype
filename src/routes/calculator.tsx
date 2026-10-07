import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { emi, inr, inrFull } from "@/lib/loan";
import { Page, Panel } from "@/components/kit";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "EMI calculator — LoanLens" },
      { name: "description", content: "Calculate monthly EMI, total interest and total repayment for any loan amount, rate and tenure." },
      { property: "og:title", content: "EMI calculator — LoanLens" },
      { property: "og:description", content: "Monthly EMI, total interest and repayment with a visual breakdown." },
    ],
  }),
  component: Calculator,
});

function Calculator() {
  const [amount, setAmount] = useState(500000);
  const [rate, setRate] = useState(10.5);
  const [years, setYears] = useState(5);
  const months = years * 12;
  const m = emi(amount, rate, months);
  const total = m * months;
  const interest = total - amount;

  const yearly = useMemo(() => {
    const r = rate / 1200;
    let bal = amount;
    const out: { y: string; Principal: number; Interest: number }[] = [];
    for (let y = 1; y <= years; y++) {
      let pp = 0, ii = 0;
      for (let k = 0; k < 12 && bal > 0; k++) { const i = bal * r; const pr = m - i; ii += i; pp += pr; bal -= pr; }
      out.push({ y: `Y${y}`, Principal: Math.round(pp), Interest: Math.round(ii) });
    }
    return out;
  }, [amount, rate, years, m]);

  const Ctl = ({ label, value, set, min, max, step, fmt }: { label: string; value: number; set: (n: number) => void; min: number; max: number; step: number; fmt: string }) => (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <label>{label}</label>
        <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => set(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
          className="num h-8 w-32 rounded-md border border-input bg-card px-2 text-right text-sm outline-none focus:border-primary" aria-label={label} />
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => set(v)} />
      <div className="mt-1 text-xs text-muted-foreground">{fmt}</div>
    </div>
  );

  return (
    <Page eyebrow="Tool" title="EMI calculator" intro="Works independently of your analysis. Standard reducing-balance EMI formula.">
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Panel title="Loan details">
          <div className="space-y-6">
            <Ctl label="Loan amount (₹)" value={amount} set={setAmount} min={10000} max={20000000} step={10000} fmt={inrFull(amount)} />
            <Ctl label="Interest rate (% p.a.)" value={rate} set={setRate} min={1} max={30} step={0.05} fmt={`${rate}% per year`} />
            <Ctl label="Tenure (years)" value={years} set={setYears} min={1} max={30} step={1} fmt={`${months} monthly instalments`} />
          </div>
        </Panel>
        <Panel title="Result">
          <div className="eyebrow">Monthly EMI</div>
          <div className="num text-4xl">{inrFull(m)}</div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-muted-foreground">Total interest</div><div className="num text-lg">{inrFull(interest)}</div></div>
            <div><div className="text-muted-foreground">Total repayment</div><div className="num text-lg">{inrFull(total)}</div></div>
          </div>
          <div className="mt-4 h-48">
            <ResponsiveContainer><PieChart>
              <Pie data={[{ name: "Principal", value: amount }, { name: "Interest", value: Math.max(0, interest) }]} dataKey="value" innerRadius={50} outerRadius={80} strokeWidth={0}>
                <Cell fill="var(--chart-1)" /><Cell fill="var(--chart-2)" />
              </Pie><Tooltip formatter={(v: number) => inr(v)} /><Legend />
            </PieChart></ResponsiveContainer>
          </div>
        </Panel>
      </div>
      <Panel title="Repayment by year" className="mt-5">
        <div className="h-64"><ResponsiveContainer><BarChart data={yearly}>
          <CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="y" stroke="var(--muted-foreground)" fontSize={11} /><YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => inr(v)} width={70} />
          <Tooltip formatter={(v: number) => inr(v)} /><Legend />
          <Bar dataKey="Principal" stackId="a" fill="var(--chart-1)" /><Bar dataKey="Interest" stackId="a" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
        </BarChart></ResponsiveContainer></div>
      </Panel>
    </Page>
  );
}
