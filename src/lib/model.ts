// In-browser inference for the Random Forest trained by ml/train_model.py.
// The trees are exported from scikit-learn as-is; prediction = mean of leaf probabilities
// (identical to sklearn's predict_proba). Per-feature contributions use the tree-path
// decomposition method (Saabas), which is exact for the model's output.
import model from "@/data/model.json";
import type { Profile } from "./loan";

interface Tree { f: number[]; t: number[]; l: number[]; r: number[]; p: number[] }

export const MODEL = model as unknown as {
  features: string[];
  importances: number[];
  medians: Record<string, number>;
  metrics: { accuracy: number; precision: number; recall: number; f1: number; confusion: number[][]; train_size: number; test_size: number; approval_rate: number };
  params: Record<string, number>;
  dataset: { rows: number; name: string };
  trees: Tree[];
};

/** Dataset incomes/loan amounts are roughly 1/10th of present-day Indian figures,
 *  so app values are divided by this fixed factor before entering the model. */
export const SCALE = 10;

export const FEATURE_LABELS: Record<string, string> = {
  Married: "Marital status",
  Dependents: "Dependents",
  Graduate: "Education",
  Self_Employed: "Self-employment",
  ApplicantIncome: "Applicant income",
  CoapplicantIncome: "Co-applicant income",
  LoanAmount: "Loan amount",
  Loan_Amount_Term: "Loan term",
  Credit_History: "Repayment record",
  Area_Rural: "Rural area",
  Area_Semiurban: "Semi-urban area",
  Area_Urban: "Urban area",
};

export function toFeatures(p: Profile): number[] {
  const applicantIncome =
    p.loanType === "business" ? Math.max(0, p.revenue - p.businessExpenses)
    : p.loanType === "agricultural" ? p.annualAgriIncome / 12
    : p.monthlyIncome;
  const co = p.loanType === "education" || p.loanType === "business" || p.loanType === "agricultural" ? 0 : p.coIncome;
  const map: Record<string, number> = {
    Married: p.married ? 1 : 0,
    Dependents: Math.min(3, p.dependents),
    Graduate: p.graduate ? 1 : 0,
    Self_Employed: p.employmentType === "salaried" || p.employmentType === "student" ? 0 : 1,
    ApplicantIncome: applicantIncome / SCALE,
    CoapplicantIncome: co / SCALE,
    LoanAmount: p.loanAmount / 1000 / SCALE,
    Loan_Amount_Term: p.tenureMonths,
    Credit_History: p.repaidHistory === "no" ? 0 : 1,
    Area_Rural: p.area === "Rural" ? 1 : 0,
    Area_Semiurban: p.area === "Semiurban" ? 1 : 0,
    Area_Urban: p.area === "Urban" ? 1 : 0,
  };
  return MODEL.features.map((f) => map[f]);
}

export interface Prediction {
  probability: number;
  approved: boolean;
  votes: number; // trees voting "approved"
  base: number;
  contributions: { feature: string; label: string; value: number }[];
}

export function predict(p: Profile): Prediction {
  const x = toFeatures(p);
  const contrib = new Array(MODEL.features.length).fill(0);
  let sum = 0, base = 0, votes = 0;
  for (const tree of MODEL.trees) {
    let node = 0;
    base += tree.p[0];
    while (tree.l[node] !== -1) {
      const f = tree.f[node];
      const next = x[f] <= tree.t[node] ? tree.l[node] : tree.r[node];
      contrib[f] += tree.p[next] - tree.p[node];
      node = next;
    }
    sum += tree.p[node];
    if (tree.p[node] > 0.5) votes++;
  }
  const n = MODEL.trees.length;
  const probability = sum / n;
  return {
    probability,
    approved: probability >= 0.5,
    votes,
    base: base / n,
    contributions: MODEL.features
      .map((f, i) => ({ feature: f, label: FEATURE_LABELS[f], value: contrib[i] / n }))
      .filter((c) => Math.abs(c.value) > 0.001)
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value)),
  };
}

export const SUPPORT_TEXT = {
  supported: "The model was trained on historical housing-style loan applications, so it applies most directly here.",
  approximate: "The model was trained on housing-style loans. For this loan type, treat its output as an approximate reference.",
  indicative: "This loan type uses features the model never saw (revenue, farm income, course details). The prediction is indicative only — rely on the financial analysis.",
} as const;
