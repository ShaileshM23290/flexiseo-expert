import type { LucideIcon } from "lucide-react";

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
          <Icon className="h-5 w-5 text-brand-600" />
        </div>
      </div>
    </div>
  );
}
