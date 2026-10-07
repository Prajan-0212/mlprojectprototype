import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { LOAN_TYPES, type LoanType } from "@/lib/loan";
import { useStore } from "@/lib/store";
import { Page, Panel } from "@/components/kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checklist")({
  head: () => ({
    meta: [
      { title: "Before you apply — LoanLens checklist" },
      { name: "description", content: "A pre-application checklist: income proof, documents, EMI affordability and scenario comparison." },
      { property: "og:title", content: "Before you apply — LoanLens checklist" },
      { property: "og:description", content: "Pre-application checklist for your loan." },
    ],
  }),
  component: Checklist,
});

const MANUAL = ["Income information ready", "Employment / business information ready", "Existing EMI and loan statements ready", "Identity and address documents ready"];
const DOCS: Record<LoanType, string[]> = {
  personal: ["Last 3 salary slips", "6 months bank statements", "PAN & Aadhaar"],
  home: ["Property papers & sale agreement", "Salary slips / ITR (2 yrs)", "Down payment proof", "Approved building plan"],
  vehicle: ["Vehicle quotation / pro-forma invoice", "Salary slips or ITR", "Bank statements"],
  education: ["Admission letter", "Fee structure", "Academic records", "Co-applicant income proof"],
  business: ["Business registration / GST", "ITR & audited financials (2–3 yrs)", "Business bank statements", "Project report (for expansion)"],
  agricultural: ["Land records (7/12, patta)", "Crop / cultivation details", "Kisan or bank account details", "Equipment quotation (if any)"],
};

function Checklist() {
  const { ready, current, scenarios } = useStore();
  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => { try { setDone(JSON.parse(localStorage.getItem("loanlens.checklist") || "{}")); } catch { /* empty */ } }, []);
  const toggle = (k: string) => setDone((d) => { const n = { ...d, [k]: !d[k] }; localStorage.setItem("loanlens.checklist", JSON.stringify(n)); return n; });

  const auto = [
    { label: "Loan amount estimated", ok: !!current },
    { label: "EMI affordability checked", ok: !!current },
    { label: "At least two scenarios compared", ok: scenarios.length >= 2 },
  ];
  const type = current?.loanType ?? "personal";
  const docs = DOCS[type];
  const all = [...MANUAL, ...docs];
  const count = all.filter((k) => done[k]).length + (ready ? auto.filter((a) => a.ok).length : 0);
  const total = all.length + auto.length;

  const Item = ({ label, ok, onClick }: { label: string; ok: boolean; onClick?: () => void }) => (
    <li>
      <button onClick={onClick} disabled={!onClick} className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted disabled:cursor-default disabled:hover:bg-transparent">
        <span className={cn("flex h-5 w-5 items-center justify-center rounded border", ok ? "border-primary bg-primary text-primary-foreground" : "border-input")}>{ok && <Check className="h-3.5 w-3.5" />}</span>
        <span className={cn(ok && "text-muted-foreground line-through")}>{label}</span>
      </button>
    </li>
  );

  return (
    <Page eyebrow={`${count} of ${total} done`} title="Before you apply" intro="A simple checklist to walk into the bank prepared.">
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${(count / total) * 100}%` }} /></div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Your information"><ul>{MANUAL.map((k) => <Item key={k} label={k} ok={!!done[k]} onClick={() => toggle(k)} />)}</ul></Panel>
        <Panel title={`Documents · ${LOAN_TYPES[type].name}`}><ul>{docs.map((k) => <Item key={k} label={k} ok={!!done[k]} onClick={() => toggle(k)} />)}</ul></Panel>
        <Panel title="Checked in LoanLens" sub="Ticked automatically from your activity"><ul>{auto.map((a) => <Item key={a.label} label={a.label} ok={ready && a.ok} />)}</ul></Panel>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Document lists are typical examples. Each lender sets its own requirements.</p>
    </Page>
  );
}
