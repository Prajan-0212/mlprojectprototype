import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FEATURE_LABELS, MODEL, SCALE } from "@/lib/model";
import { Note, Page, Panel, Stat } from "@/components/kit";

export const Route = createFileRoute("/model")({
  head: () => ({
    meta: [
      { title: "Model evaluation — LoanLens" },
      { name: "description", content: "Accuracy, precision, recall, F1, confusion matrix and feature importance of the LoanLens Random Forest model." },
      { property: "og:title", content: "Model evaluation — LoanLens" },
      { property: "og:description", content: "Honest evaluation metrics for the LoanLens Random Forest." },
    ],
  }),
  component: ModelPage,
});

const PIPELINE = ["Dataset", "Cleaning", "Missing values", "Encoding", "Features", "Train/test split", "Random Forest", "Evaluation", "Export model", "Web app", "Prediction"];

function ModelPage() {
  const m = MODEL.metrics;
  const [[tn, fp], [fn, tp]] = m.confusion;
  const imp = MODEL.features.map((f, i) => ({ f: FEATURE_LABELS[f], v: +(MODEL.importances[i] * 100).toFixed(1) })).sort((a, b) => b.v - a.v);
  const ch = imp.find((x) => x.f === "Repayment record")?.v ?? 0;

  return (
    <Page eyebrow="Machine learning" title="Model evaluation" intro={`Random Forest Classifier trained on the ${MODEL.dataset.name}. All figures below are read from the training run's output.`}>
      <div className="mb-5 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
        Evaluation was performed on a small working dataset ({m.test_size} test applications) and should not be interpreted as real-world bank approval accuracy.
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Accuracy" value={`${(m.accuracy * 100).toFixed(1)}%`} />
        <Stat label="Precision" value={`${(m.precision * 100).toFixed(1)}%`} hint="Of predicted approvals, share truly approved" />
        <Stat label="Recall" value={`${(m.recall * 100).toFixed(1)}%`} hint="Of true approvals, share the model found" />
        <Stat label="F1-score" value={`${(m.f1 * 100).toFixed(1)}%`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Panel title="Confusion matrix" sub="Test set · rows actual, columns predicted">
          <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-sm">
            <div />
            <div className="eyebrow text-center">Pred. rejected</div>
            <div className="eyebrow text-center">Pred. approved</div>
            <div className="eyebrow self-center">Actual rejected</div>
            <div className="num rounded-lg bg-success/15 py-6 text-center text-2xl">{tn}</div>
            <div className="num rounded-lg bg-destructive/10 py-6 text-center text-2xl">{fp}</div>
            <div className="eyebrow self-center">Actual approved</div>
            <div className="num rounded-lg bg-destructive/10 py-6 text-center text-2xl">{fn}</div>
            <div className="num rounded-lg bg-success/15 py-6 text-center text-2xl">{tp}</div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            The model finds almost all approvals but misclassifies {fp} of {tn + fp} rejected applications as approved — it leans optimistic. Baseline (always "approve") would score {(m.approval_rate * 100).toFixed(0)}%.
          </p>
        </Panel>
        <Panel title="Feature importance" sub="Mean decrease in impurity across all trees">
          <div className="h-80"><ResponsiveContainer><BarChart data={imp} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid horizontal={false} stroke="var(--border)" />
            <XAxis type="number" unit="%" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis type="category" dataKey="f" width={130} stroke="var(--muted-foreground)" fontSize={11} />
            <Tooltip formatter={(v: number) => `${v}%`} /><Bar dataKey="v" name="Importance" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
          </BarChart></ResponsiveContainer></div>
          <Note>Repayment record (Credit_History) carries {ch}% of the importance. That is why LoanLens keeps the ML prediction as one part of the report and builds the readiness score from your wider financial picture.</Note>
        </Panel>
      </div>

      <Panel title="Pipeline" className="mt-5">
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {PIPELINE.map((s, i) => (
            <li key={s} className="flex items-center gap-2"><span className="rounded-md border border-border bg-muted px-2.5 py-1">{s}</span>{i < PIPELINE.length - 1 && <span className="text-muted-foreground">→</span>}</li>
          ))}
        </ol>
        <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <div className="eyebrow mb-1">Training setup</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>{MODEL.dataset.rows} rows · {m.train_size} train / {m.test_size} test (stratified, seed {MODEL.params.random_state})</li>
              <li>{MODEL.params.n_estimators} trees · max depth {MODEL.params.max_depth} · min samples per leaf {MODEL.params.min_samples_leaf}</li>
              <li>Missing numbers → median; missing categories → most frequent value</li>
              <li>Gender deliberately excluded from features</li>
            </ul>
          </div>
          <div>
            <div className="eyebrow mb-1">How your inputs reach the model</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>Incomes and loan amount are divided by {SCALE} to match the dataset's scale (its figures are far lower than today's Indian salaries).</li>
              <li>"No previous credit" is treated as a clean record, matching how missing history was filled in training.</li>
              <li>Business and farm income map to applicant income; other loan-specific fields are not model inputs.</li>
            </ul>
          </div>
        </div>
      </Panel>
    </Page>
  );
}
