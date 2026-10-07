// LoanLens financial calculations and rule-based readiness analysis.
// Everything here is deterministic: the same profile always yields the same numbers.

export type LoanType = "personal" | "home" | "vehicle" | "education" | "business" | "agricultural";
export type Employment = "salaried" | "self" | "business" | "farmer" | "student";
export type Area = "Urban" | "Semiurban" | "Rural";
export type History = "yes" | "no" | "none";

export interface Profile {
  loanType: LoanType;
  monthlyIncome: number;
  coIncome: number;
  monthlyExpenses: number;
  existingEmi: number;
  savings: number;
  employmentType: Employment;
  yearsStable: number;
  dependents: number;
  married: boolean;
  graduate: boolean;
  area: Area;
  repaidHistory: History;
  loanAmount: number;
  tenureMonths: number;
  interestRate: number;
  // loan-specific
  assetValue: number;
  downPayment: number;
  courseFee: number;
  courseType: string;
  institution: string;
  studyYears: number;
  revenue: number;
  businessExpenses: number;
  businessType: string;
  purpose: string;
  annualAgriIncome: number;
  landAcres: number;
  seasonal: boolean;
}

export interface FieldDef {
  key: keyof Profile;
  label: string;
  kind: "money" | "number" | "select" | "toggle" | "percent";
  options?: { value: string; label: string }[];
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface LoanTypeInfo {
  id: LoanType;
  name: string;
  short: string;
  rate: number;
  maxTenure: number;
  maxLtv?: number;
  modelSupport: "supported" | "approximate" | "indicative";
  income: FieldDef[];
  loan: FieldDef[];
  showEmployment: boolean;
}

const money = (key: keyof Profile, label: string, hint?: string): FieldDef => ({ key, label, kind: "money", hint });

const commonIncome: FieldDef[] = [
  money("monthlyIncome", "Monthly take-home income"),
  money("coIncome", "Co-applicant monthly income", "Spouse or family member applying with you. Enter 0 if none."),
  money("monthlyExpenses", "Monthly household expenses"),
  money("existingEmi", "Existing EMIs per month", "Total of all loans and card EMIs you already pay."),
  money("savings", "Savings & liquid funds"),
];
const tenure = (max: number): FieldDef => ({ key: "tenureMonths", label: "Tenure (months)", kind: "number", min: 6, max, step: 6 });
const rate: FieldDef = { key: "interestRate", label: "Expected interest rate (% p.a.)", kind: "percent", min: 4, max: 30, step: 0.25 };

export const LOAN_TYPES: Record<LoanType, LoanTypeInfo> = {
  personal: {
    id: "personal", name: "Personal Loan", short: "Unsecured funds for any personal need",
    rate: 12, maxTenure: 84, modelSupport: "approximate", showEmployment: true,
    income: commonIncome,
    loan: [money("loanAmount", "Requested loan amount"), tenure(84), rate],
  },
  home: {
    id: "home", name: "Home Loan", short: "Buy or build a residential property",
    rate: 8.75, maxTenure: 360, maxLtv: 0.8, modelSupport: "supported", showEmployment: true,
    income: commonIncome,
    loan: [money("assetValue", "Property value"), money("downPayment", "Down payment"), money("loanAmount", "Requested loan amount"), tenure(360), rate],
  },
  vehicle: {
    id: "vehicle", name: "Vehicle Loan", short: "Finance a car or two-wheeler",
    rate: 9.5, maxTenure: 84, maxLtv: 0.85, modelSupport: "approximate", showEmployment: true,
    income: commonIncome,
    loan: [money("assetValue", "Vehicle on-road price"), money("downPayment", "Down payment"), money("loanAmount", "Requested loan amount"), tenure(84), rate],
  },
  education: {
    id: "education", name: "Education Loan", short: "Fund tuition and study costs",
    rate: 10, maxTenure: 180, modelSupport: "indicative", showEmployment: false,
    income: [
      money("monthlyIncome", "Family monthly income"),
      money("monthlyExpenses", "Family monthly expenses"),
      money("existingEmi", "Existing family obligations (EMI)"),
      money("savings", "Family savings"),
    ],
    loan: [
      { key: "courseType", label: "Course type", kind: "select", options: [
        { value: "Undergraduate", label: "Undergraduate" }, { value: "Postgraduate", label: "Postgraduate" },
        { value: "Professional", label: "Professional (MBA/Medical/Law)" }, { value: "Diploma", label: "Diploma / Certificate" }] },
      { key: "institution", label: "Institution type", kind: "select", options: [
        { value: "Government", label: "Government / Public" }, { value: "Private", label: "Private (India)" }, { value: "Abroad", label: "Abroad" }] },
      money("courseFee", "Total course fee"),
      { key: "studyYears", label: "Study duration (years)", kind: "number", min: 1, max: 6, step: 1 },
      money("loanAmount", "Requested loan amount"), tenure(180), rate,
    ],
  },
  business: {
    id: "business", name: "Business Loan", short: "Working capital or expansion for your business",
    rate: 14, maxTenure: 120, modelSupport: "indicative", showEmployment: false,
    income: [
      money("revenue", "Average monthly revenue"),
      money("businessExpenses", "Monthly business expenses"),
      money("monthlyExpenses", "Monthly household expenses"),
      money("existingEmi", "Existing business debt EMI"),
      money("savings", "Business & personal reserves"),
    ],
    loan: [
      { key: "businessType", label: "Business type", kind: "select", options: [
        { value: "Retail", label: "Retail / Trading" }, { value: "Manufacturing", label: "Manufacturing" },
        { value: "Services", label: "Services" }, { value: "Food", label: "Food & Hospitality" }] },
      { key: "purpose", label: "Loan purpose", kind: "select", options: [
        { value: "Working capital", label: "Working capital" }, { value: "Expansion", label: "Expansion" },
        { value: "Equipment", label: "Equipment purchase" }, { value: "Refinance", label: "Refinance debt" }] },
      money("loanAmount", "Requested loan amount"), tenure(120), rate,
    ],
  },
  agricultural: {
    id: "agricultural", name: "Agricultural Loan", short: "Crop, equipment or farm development",
    rate: 7, maxTenure: 120, modelSupport: "indicative", showEmployment: false,
    income: [
      money("annualAgriIncome", "Estimated annual farm income"),
      { key: "landAcres", label: "Cultivated land (acres)", kind: "number", min: 0, max: 500, step: 0.5 },
      { key: "seasonal", label: "Income arrives seasonally (harvest-based)", kind: "toggle" },
      money("monthlyExpenses", "Monthly household expenses"),
      money("existingEmi", "Existing EMIs per month"),
      money("savings", "Savings & reserves"),
    ],
    loan: [
      { key: "purpose", label: "Loan purpose", kind: "select", options: [
        { value: "Crop", label: "Crop / seasonal inputs" }, { value: "Equipment", label: "Tractor / equipment" },
        { value: "Irrigation", label: "Irrigation / land development" }, { value: "Livestock", label: "Livestock / dairy" }] },
      money("loanAmount", "Requested loan amount"), tenure(120), rate,
    ],
  },
};

export const PROFILE_FIELDS: FieldDef[] = [
  { key: "employmentType", label: "Employment type", kind: "select", options: [
    { value: "salaried", label: "Salaried" }, { value: "self", label: "Self-employed professional" }, { value: "business", label: "Business owner" }] },
  { key: "yearsStable", label: "Years in current job / business", kind: "number", min: 0, max: 40, step: 1 },
  { key: "dependents", label: "Dependents", kind: "number", min: 0, max: 8, step: 1 },
  { key: "area", label: "Area you live in", kind: "select", options: [
    { value: "Urban", label: "Urban" }, { value: "Semiurban", label: "Semi-urban" }, { value: "Rural", label: "Rural" }] },
  { key: "repaidHistory", label: "Past repayment record", kind: "select", hint: "Have past loans / cards been repaid on time?", options: [
    { value: "yes", label: "Repaid on time" }, { value: "none", label: "No previous credit" }, { value: "no", label: "Missed / defaulted payments" }] },
  { key: "married", label: "Married", kind: "toggle" },
  { key: "graduate", label: "Graduate or higher", kind: "toggle" },
];

const BASE: Profile = {
  loanType: "personal", monthlyIncome: 75000, coIncome: 0, monthlyExpenses: 30000, existingEmi: 5000, savings: 300000,
  employmentType: "salaried", yearsStable: 4, dependents: 1, married: true, graduate: true, area: "Urban", repaidHistory: "yes",
  loanAmount: 400000, tenureMonths: 36, interestRate: 12, assetValue: 0, downPayment: 0, courseFee: 0, courseType: "Postgraduate",
  institution: "Private", studyYears: 2, revenue: 0, businessExpenses: 0, businessType: "Retail", purpose: "Working capital",
  annualAgriIncome: 0, landAcres: 0, seasonal: true,
};

export function defaultProfile(type: LoanType): Profile {
  const t = LOAN_TYPES[type];
  const p: Profile = { ...BASE, loanType: type, interestRate: t.rate };
  switch (type) {
    case "home": return { ...p, monthlyIncome: 120000, coIncome: 40000, savings: 800000, assetValue: 6000000, downPayment: 1500000, loanAmount: 4500000, tenureMonths: 240 };
    case "vehicle": return { ...p, assetValue: 1000000, downPayment: 200000, loanAmount: 800000, tenureMonths: 60 };
    case "education": return { ...p, monthlyIncome: 90000, courseFee: 1600000, loanAmount: 1200000, tenureMonths: 120, employmentType: "student", graduate: true };
    case "business": return { ...p, monthlyIncome: 0, revenue: 450000, businessExpenses: 330000, monthlyExpenses: 40000, existingEmi: 15000, savings: 600000, employmentType: "business", yearsStable: 5, loanAmount: 1500000, tenureMonths: 60, purpose: "Expansion" };
    case "agricultural": return { ...p, monthlyIncome: 0, annualAgriIncome: 700000, landAcres: 6, monthlyExpenses: 20000, existingEmi: 3000, savings: 150000, employmentType: "farmer", yearsStable: 12, area: "Rural", graduate: false, loanAmount: 500000, tenureMonths: 60, purpose: "Equipment" };
    default: return p;
  }
}

export type DemoKind = "strong" | "medium" | "risky";
export const DEMO_LABELS: Record<DemoKind, { title: string; desc: string }> = {
  strong: { title: "Strong profile", desc: "Good income, manageable expenses, moderate loan." },
  medium: { title: "Medium profile", desc: "Moderate income with some existing obligations." },
  risky: { title: "High-risk profile", desc: "Heavy obligations and a large requested loan." },
};

export function demoProfile(type: LoanType, kind: DemoKind): Profile {
  const p = defaultProfile(type);
  if (kind === "strong") {
    return { ...p, existingEmi: Math.round(p.existingEmi * 0.4), savings: p.savings * 2, yearsStable: Math.max(p.yearsStable, 7), repaidHistory: "yes", dependents: 1,
      loanAmount: Math.round(p.loanAmount * 0.75), downPayment: Math.round(p.downPayment * 1.3) };
  }
  if (kind === "medium") return p;
  const scale = (n: number) => Math.round(n * 0.7);
  return { ...p, monthlyIncome: scale(p.monthlyIncome), coIncome: 0, revenue: scale(p.revenue), annualAgriIncome: scale(p.annualAgriIncome),
    monthlyExpenses: Math.round(p.monthlyExpenses * 1.2), existingEmi: Math.round(p.existingEmi * 3 + 8000), savings: Math.round(p.savings * 0.2),
    yearsStable: 1, dependents: 3, repaidHistory: "no", loanAmount: Math.round(p.loanAmount * 1.4), downPayment: Math.round(p.downPayment * 0.4) };
}

// ---------- calculations ----------

export function emi(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

export function principalFromEmi(e: number, annualRate: number, months: number): number {
  if (e <= 0) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return e * months;
  return (e * (1 - Math.pow(1 + r, -months))) / r;
}

export function effectiveIncome(p: Profile): number {
  if (p.loanType === "business") return Math.max(0, p.revenue - p.businessExpenses);
  if (p.loanType === "agricultural") return p.annualAgriIncome / 12;
  if (p.loanType === "education") return p.monthlyIncome;
  return p.monthlyIncome + p.coIncome;
}

export type Level = "Strong" | "Good" | "Needs Improvement" | "High Concern";
export type Risk = "Low" | "Medium" | "High";

export interface ScorePart { label: string; points: number; max: number; note: string }

export interface Analysis {
  income: number;
  newEmi: number;
  totalEmi: number;
  emiBurden: number;
  expenseRatio: number;
  surplus: number;
  savingsMonths: number;
  totalInterest: number;
  totalRepayment: number;
  ltv: number | null;
  comfortable: { low: number; high: number };
  score: number;
  level: Level;
  risk: Risk;
  parts: ScorePart[];
  strengths: string[];
  concerns: string[];
  suggestions: string[];
}

const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const lin = (v: number, good: number, bad: number) => clamp((v - bad) / (good - bad));

export function levelOf(score: number): Level {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Improvement";
  return "High Concern";
}

export function analyze(p: Profile): Analysis {
  const t = LOAN_TYPES[p.loanType];
  const income = effectiveIncome(p);
  const newEmi = emi(p.loanAmount, p.interestRate, p.tenureMonths);
  const totalEmi = newEmi + p.existingEmi;
  const safe = income > 0 ? income : 1;
  const emiBurden = totalEmi / safe;
  const expenseRatio = p.monthlyExpenses / safe;
  const surplus = income - p.monthlyExpenses - totalEmi;
  const outgo = p.monthlyExpenses + p.existingEmi;
  const savingsMonths = outgo > 0 ? p.savings / outgo : 12;
  const totalRepayment = newEmi * p.tenureMonths;
  const totalInterest = Math.max(0, totalRepayment - p.loanAmount);
  const ltv = t.maxLtv && p.assetValue > 0 ? p.loanAmount / p.assetValue : null;

  // comfortable EMI: total EMIs within 40% of income and within 70% of what is left after expenses
  const maxEmi = Math.max(0, Math.min(0.4 * income - p.existingEmi, 0.7 * (income - p.monthlyExpenses - p.existingEmi)));
  let high = principalFromEmi(maxEmi, p.interestRate, p.tenureMonths);
  if (t.maxLtv && p.assetValue > 0) high = Math.min(high, p.assetValue * t.maxLtv, Math.max(0, p.assetValue - p.downPayment));
  if (p.loanType === "education" && p.courseFee > 0) high = Math.min(high, p.courseFee);
  high = Math.max(0, high);
  const comfortable = { low: Math.round(high * 0.7), high: Math.round(high) };

  const stabilityYears = p.loanType === "agricultural" ? p.yearsStable : p.yearsStable;
  const parts: ScorePart[] = [
    { label: "EMI burden", max: 30, points: 30 * lin(emiBurden, 0.3, 0.65), note: `${pct(emiBurden)} of income goes to EMIs` },
    { label: "Monthly surplus", max: 20, points: 20 * lin(surplus / safe, 0.25, 0), note: `${inr(surplus)} left each month` },
    { label: "Savings buffer", max: 15, points: 15 * lin(savingsMonths, 6, 0), note: `${savingsMonths.toFixed(1)} months of expenses covered` },
    { label: "Income stability", max: 15, points: 15 * lin(stabilityYears, 5, 0) * (p.loanType === "agricultural" && p.seasonal ? 0.85 : 1), note: `${stabilityYears} yrs in current work` },
    { label: "Repayment record", max: 10, points: p.repaidHistory === "yes" ? 10 : p.repaidHistory === "none" ? 6 : 0, note: p.repaidHistory === "yes" ? "On-time history" : p.repaidHistory === "none" ? "No credit history yet" : "Past missed payments" },
    { label: "Dependents", max: 5, points: p.dependents <= 1 ? 5 : p.dependents === 2 ? 3 : 1, note: `${p.dependents} dependent(s)` },
    ltv !== null
      ? { label: "Down payment", max: 5, points: ltv <= 0.7 ? 5 : ltv <= 0.8 ? 3 : ltv <= 0.9 ? 1 : 0, note: `Loan is ${pct(ltv)} of the asset value` }
      : { label: "Amount vs comfort range", max: 5, points: 5 * lin(p.loanAmount / Math.max(1, comfortable.high), 1, 1.6), note: `Requested ${inr(p.loanAmount)}` },
  ];
  const score = Math.round(parts.reduce((s, x) => s + x.points, 0));
  const level = levelOf(score);
  const risk: Risk = score < 40 || emiBurden > 0.6 || surplus < 0 ? "High" : score < 65 || emiBurden > 0.45 ? "Medium" : "Low";

  const strengths: string[] = [];
  const concerns: string[] = [];
  const suggestions: string[] = [];
  if (emiBurden <= 0.35) strengths.push("EMIs stay within a comfortable share of your income.");
  else concerns.push(`Total EMIs would take ${pct(emiBurden)} of your income.`);
  if (surplus / safe >= 0.2) strengths.push("You keep a healthy monthly surplus after all obligations.");
  else if (surplus < 0) concerns.push("Your expenses and EMIs exceed your income.");
  else concerns.push("Little money would be left each month after EMIs and expenses.");
  if (savingsMonths >= 6) strengths.push("Your savings can cover more than 6 months of outgoings.");
  else if (savingsMonths < 3) concerns.push("Savings cover less than 3 months of outgoings.");
  if (p.yearsStable >= 5) strengths.push("Long stability in your current work or business.");
  else if (p.yearsStable < 2) concerns.push("Less than 2 years in current work or business.");
  if (p.repaidHistory === "yes") strengths.push("A record of on-time repayments.");
  if (p.repaidHistory === "no") concerns.push("Past missed payments are a significant concern for lenders.");
  if (ltv !== null && ltv > 0.8) concerns.push(`The loan covers ${pct(ltv)} of the asset value — a small down payment.`);
  if (p.loanType === "agricultural" && p.seasonal) concerns.push("Seasonal income needs repayment planning around harvest months.");

  if (p.existingEmi > 0.2 * safe) suggestions.push("Your existing EMI is relatively high compared with your income. Closing or reducing a smaller loan first could help.");
  if (p.loanAmount > comfortable.high && comfortable.high > 0) suggestions.push(`Reducing the requested amount towards ${inr(comfortable.high)} may improve affordability.`);
  if (emiBurden > 0.4 && p.tenureMonths < t.maxTenure) suggestions.push("A longer tenure lowers the EMI, though you will pay more interest overall.");
  if (ltv !== null && ltv > 0.75) suggestions.push("Increasing the down payment reduces the loan you need and the interest you pay.");
  if (savingsMonths < 3) suggestions.push("Build an emergency fund of at least 3–6 months of expenses before applying.");
  if (p.repaidHistory === "no") suggestions.push("Clear any overdue payments and keep a few months of on-time repayments before applying.");
  if (p.repaidHistory === "none") suggestions.push("A co-applicant or a small secured credit line can help you start a repayment record.");
  if (p.loanType !== "education" && p.loanType !== "business" && p.loanType !== "agricultural" && p.coIncome === 0 && emiBurden > 0.4)
    suggestions.push("Adding an earning co-applicant can strengthen your income profile.");
  if (expenseRatio > 0.5) suggestions.push("Household expenses take over half your income — trimming them raises your monthly surplus.");
  if (suggestions.length === 0) suggestions.push("Your profile looks balanced. Compare a couple of tenure options to find the most comfortable EMI.");

  return { income, newEmi, totalEmi, emiBurden, expenseRatio, surplus, savingsMonths, totalInterest, totalRepayment, ltv, comfortable, score, level, risk, parts, strengths, concerns, suggestions };
}

// ---------- formatting ----------

export function inr(n: number): string {
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(2)} L`;
  return `${sign}₹${Math.round(a).toLocaleString("en-IN")}`;
}
export const inrFull = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
export const pct = (n: number) => `${Math.round(n * 100)}%`;
export const tenureLabel = (m: number) => (m % 12 === 0 ? `${m / 12} yr` : `${m} mo`);
