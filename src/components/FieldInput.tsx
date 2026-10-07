import type { FieldDef, Profile } from "@/lib/loan";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const inputCls = "h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20";

export function FieldInput({ field, profile, onChange, error }: { field: FieldDef; profile: Profile; onChange: (k: keyof Profile, v: unknown) => void; error?: string }) {
  const value = profile[field.key];
  const id = `f-${field.key}`;
  if (field.kind === "toggle") {
    return (
      <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-input bg-card px-3 py-2.5 sm:col-span-2">
        <span className="text-sm">{field.label}</span>
        <Switch id={id} checked={Boolean(value)} onCheckedChange={(v) => onChange(field.key, v)} />
      </label>
    );
  }
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{field.label}</label>
      {field.kind === "select" ? (
        <select id={id} className={inputCls} value={String(value)} onChange={(e) => onChange(field.key, e.target.value)}>
          {field.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <div className="relative">
          {field.kind === "money" && <span className="num pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>}
          <input id={id} type="number" inputMode="decimal" min={field.min ?? 0} max={field.max} step={field.step ?? (field.kind === "money" ? 1000 : 1)}
            className={cn(inputCls, "num", field.kind === "money" && "pl-7", error && "border-destructive")}
            value={Number.isFinite(value as number) ? (value as number) : ""}
            onChange={(e) => onChange(field.key, e.target.value === "" ? 0 : Number(e.target.value))} />
          {field.kind === "percent" && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>}
        </div>
      )}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : field.hint && <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>}
    </div>
  );
}
