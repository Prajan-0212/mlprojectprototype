import { LOAN_TYPES, type Profile } from "@/lib/loan";
import { MODEL, SUPPORT_TEXT, type Prediction } from "@/lib/model";
import { Note, Panel, Pill } from "./kit";
import { cn } from "@/lib/utils";

export function PredictionPanel({ profile, pred }: { profile: Profile; pred: Prediction }) {
  const support = LOAN_TYPES[profile.loanType].modelSupport;
  return (
    <Panel title="Machine learning prediction" sub={`Random Forest · ${MODEL.trees.length} trees · trained on ${MODEL.dataset.rows} historical applications`}
      right={<Pill tone={support === "supported" ? "good" : support === "approximate" ? "warn" : "neutral"}>{support === "supported" ? "Directly applicable" : support === "approximate" ? "Approximate" : "Indicative only"}</Pill>}>
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div>
          <div className="eyebrow">Predicted outcome</div>
          <div className={cn("font-display text-3xl font-semibold", pred.approved ? "text-success" : "text-destructive")}>
            {pred.approved ? "Likely approved" : "Likely rejected"}
          </div>
        </div>
        <div>
          <div className="eyebrow">Model probability (approval)</div>
          <div className="num text-3xl">{Math.round(pred.probability * 100)}%</div>
        </div>
        <div>
          <div className="eyebrow">Tree votes</div>
          <div className="num text-3xl">{pred.votes}<span className="text-base text-muted-foreground">/{MODEL.trees.length}</span></div>
        </div>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-destructive/20">
        <div className="h-full bg-success transition-all duration-700" style={{ width: `${pred.probability * 100}%` }} />
      </div>
      <div className="mt-4"><Note>{SUPPORT_TEXT[support]} The probability is the averaged output of the forest's trees, not a guaranteed bank decision.</Note></div>
    </Panel>
  );
}

export function ExplanationPanel({ pred }: { pred: Prediction }) {
  const pos = pred.contributions.filter((c) => c.value > 0);
  const neg = pred.contributions.filter((c) => c.value < 0);
  const max = Math.max(0.01, ...pred.contributions.map((c) => Math.abs(c.value)));
  const Row = ({ c }: { c: Prediction["contributions"][number] }) => (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
      <span className="text-sm">{c.label}</span>
      <span className={cn("num text-xs", c.value > 0 ? "text-success" : "text-destructive")}>{c.value > 0 ? "+" : ""}{(c.value * 100).toFixed(1)} pts</span>
      <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", c.value > 0 ? "bg-success" : "bg-destructive")} style={{ width: `${(Math.abs(c.value) / max) * 100}%` }} />
      </div>
    </li>
  );
  return (
    <Panel title="Why did I get this result?" sub="How much each input moved the approval probability for your profile">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-success">Factors supporting approval</h3>
          {pos.length ? <ul className="space-y-3">{pos.map((c) => <Row key={c.feature} c={c} />)}</ul> : <p className="text-sm text-muted-foreground">None for this profile.</p>}
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-destructive">Factors working against it</h3>
          {neg.length ? <ul className="space-y-3">{neg.map((c) => <Row key={c.feature} c={c} />)}</ul> : <p className="text-sm text-muted-foreground">None for this profile.</p>}
        </div>
      </div>
      <div className="mt-5">
        <Note>Starting point is the training approval rate ({Math.round(pred.base * 100)}%). Each input then shifts the probability along the decision paths of every tree (tree-path decomposition). Contributions sum exactly to your final {Math.round(pred.probability * 100)}%.</Note>
      </div>
    </Panel>
  );
}
