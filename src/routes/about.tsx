import { createFileRoute } from "@tanstack/react-router";
import { Page, Panel } from "@/components/kit";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How it works & Responsible AI — LoanLens" },
      { name: "description", content: "How LoanLens works, what its machine-learning model can and cannot do, and how your data is handled." },
      { property: "og:title", content: "How it works & Responsible AI — LoanLens" },
      { property: "og:description", content: "What LoanLens can and cannot tell you." },
    ],
  }),
  component: About,
});

const PRINCIPLES = [
  ["An academic prototype", "LoanLens is a project-based-learning prototype for decision support and education. It is not a lender, credit bureau or financial advisor."],
  ["Predictions are not bank decisions", "The model estimates how similar historical applications were decided. Real lenders use many more checks, documents and policies."],
  ["Data quality limits the model", "The model learned from 614 historical applications. Small, old datasets generalise poorly and may not represent your situation."],
  ["Historical data can carry bias", "Past decisions may reflect unfair patterns. We removed gender as an input, but other features (like area) can still correlate with bias."],
  ["Don't decide on this alone", "Use LoanLens to prepare and ask better questions — then speak to lenders and read official terms before borrowing."],
  ["Your data stays with you", "Everything you enter is processed in your browser and saved only on this device. You can clear history at any time."],
];

const LAYERS = [
  ["Financial calculations", "EMI, total interest, EMI burden, monthly surplus, loan-to-value and the comfortable range — standard formulas."],
  ["Rule-based readiness score", "A transparent 0–100 points system across seven factors. Every point is shown in your report."],
  ["Machine-learning prediction", "A Random Forest trained with scikit-learn, run in your browser, with per-factor explanations from the trees themselves."],
];

function About() {
  return (
    <Page eyebrow="About" title="How it works & Responsible AI" intro="LoanLens separates what is calculated, what is rule-based, and what is learned by the model.">
      <div className="grid gap-4 md:grid-cols-3">
        {LAYERS.map(([t, b], i) => (
          <Panel key={t}><div className="num text-xs text-primary">0{i + 1}</div><h2 className="mt-1 font-semibold">{t}</h2><p className="mt-1 text-sm text-muted-foreground">{b}</p></Panel>
        ))}
      </div>
      <h2 className="mt-10 font-display text-2xl font-semibold">Responsible use</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {PRINCIPLES.map(([t, b]) => (
          <div key={t} className="border-l-2 border-primary pl-4"><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{b}</p></div>
        ))}
      </div>
    </Page>
  );
}
