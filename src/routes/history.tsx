import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2, ExternalLink } from "lucide-react";
import { inr, levelOf, LOAN_TYPES, tenureLabel } from "@/lib/loan";
import { useStore } from "@/lib/store";
import { Empty, Loading, Page, Pill, levelTone, riskTone } from "@/components/kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Analysis history — LoanLens" },
      { name: "description", content: "Your previous loan readiness analyses, stored privately on this device." },
      { property: "og:title", content: "Analysis history — LoanLens" },
      { property: "og:description", content: "Previous loan readiness analyses stored on this device." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { ready, history, setCurrent, removeHistory, clearHistory } = useStore();
  const navigate = useNavigate();
  if (!ready) return <Loading />;
  return (
    <Page eyebrow="Saved on this device" title="Analysis history" intro="Stored only in this browser — nothing is sent to a server."
      actions={history.length > 0 ? <Button variant="ghost" onClick={clearHistory}>Clear history</Button> : undefined}>
      {history.length === 0 ? <Empty title="No analyses yet" body="Each analysis you run is saved here so you can reopen it later." /> : (
        <ul className="space-y-3">
          {history.map((h) => (
            <li key={h.id} className="panel flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
              <div className="min-w-48 flex-1">
                <div className="font-medium">{LOAN_TYPES[h.profile.loanType].name} · <span className="num">{inr(h.profile.loanAmount)}</span> · {tenureLabel(h.profile.tenureMonths)}</div>
                <div className="text-xs text-muted-foreground">{new Date(h.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
              </div>
              <div className="flex items-center gap-2"><span className="num text-lg">{h.score}</span><Pill tone={levelTone(levelOf(h.score))}>{levelOf(h.score)}</Pill></div>
              <Pill tone={riskTone(h.risk)}>{h.risk} risk</Pill>
              <div className="text-sm"><span className="text-muted-foreground">Model: </span><span className="num">{Math.round(h.probability * 100)}%</span> {h.probability >= 0.5 ? "likely approved" : "likely rejected"}</div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => { setCurrent(h.profile); navigate({ to: "/report" }); }}><ExternalLink /> Open</Button>
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => removeHistory(h.id)}><Trash2 /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
