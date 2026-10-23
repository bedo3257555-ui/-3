import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { formatLong, num, todayISO } from "@/lib/format";
import { useProtocol } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-surface p-4 shadow-sm", className)}>
      {children}
    </section>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" | "ghost" | "line" }) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" && "bg-accent text-accent-fg hover:opacity-90",
        variant === "soft" && "bg-accent-soft text-accent hover:opacity-90",
        variant === "ghost" && "text-muted hover:bg-surface-2 hover:text-fg",
        variant === "line" && "border border-line bg-surface text-fg hover:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}

export function Meter({ value, max, over }: { value: number; max: number; over?: boolean }) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
      <div
        className={cn("h-full rounded-full bg-accent transition-[width] duration-300", over && "opacity-70")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Ring({ value, caption }: { value: number; caption: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="relative grid size-24 place-items-center text-accent">
      <svg viewBox="0 0 88 88" className="size-24">
        <circle cx="44" cy="44" r={r} fill="none" className="stroke-surface-2" strokeWidth="7" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform="rotate(-90 44 44)"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-sm font-semibold text-fg tabular-nums">{caption}</div>
      </div>
    </div>
  );
}

export function Kpi({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: ReactNode;
}) {
  return (
    <Card className="flex min-h-28 flex-col justify-between">
      <p className="text-xs font-medium text-muted">{label}</p>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
          {unit ? <span className="text-xs text-muted">{unit}</span> : null}
        </div>
        {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
      </div>
    </Card>
  );
}

export function Delta({
  now,
  prev,
  digits = 1,
  prefer,
}: {
  now?: number;
  prev?: number;
  digits?: number;
  prefer?: "up" | "down";
}) {
  if (now == null || prev == null) return <span className="text-muted">من InBody</span>;
  const d = now - prev;
  if (Math.abs(d) < 0.05) return <span>ثابت عن السابقة</span>;
  const good = prefer === "down" ? d < 0 : prefer === "up" ? d > 0 : false;
  return (
    <span className={cn(good && "font-medium text-accent")}>
      {d > 0 ? "+" : ""}
      {num(d, digits)} عن السابقة
    </span>
  );
}

export function DateBar() {
  const focus = useProtocol((s) => s.focusDate);
  const shift = useProtocol((s) => s.shiftFocus);
  const goToday = useProtocol((s) => s.goToday);
  const today = todayISO();
  return (
    <div className="no-print flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-2 py-2">
      <Button variant="ghost" className="px-3" onClick={() => shift(-1)} aria-label="اليوم السابق">
        السابق
      </Button>
      <div className="text-center">
        <p className="text-sm font-semibold">{formatLong(focus)}</p>
        {focus !== today ? (
          <button className="text-xs font-medium text-accent" onClick={goToday}>
            العودة لليوم
          </button>
        ) : (
          <p className="text-xs text-faint">اليوم</p>
        )}
      </div>
      <Button variant="ghost" className="px-3" onClick={() => shift(1)} disabled={focus >= today} aria-label="اليوم التالي">
        التالي
      </Button>
    </div>
  );
}

export function NumField({
  value,
  onCommit,
  placeholder,
  className,
  nullable = false,
}: {
  value: number | null;
  onCommit: (n: number | null) => void;
  placeholder?: string;
  className?: string;
  nullable?: boolean;
}) {
  const blank = value == null || (!nullable && value === 0);
  const [text, setText] = useState(blank ? "" : String(value));
  useEffect(() => {
    setText(blank ? "" : String(value));
  }, [blank, value]);
  return (
    <input
      inputMode="decimal"
      dir="ltr"
      placeholder={placeholder}
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-bg px-2 text-center text-sm tabular-nums outline-none focus:border-accent",
        className,
      )}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        if (text.trim() === "") {
          onCommit(nullable ? null : 0);
          return;
        }
        const n = Number(text);
        if (!Number.isFinite(n)) {
          setText(blank ? "" : String(value));
          return;
        }
        onCommit(n);
      }}
    />
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{body}</p>
    </div>
  );
}

export function Skeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2" />
      ))}
    </div>
  );
}

export function PageIntro({ kicker, title, body }: { kicker: string; title: string; body?: string }) {
  return (
    <header className="mb-5">
      <p className="text-xs font-semibold tracking-wide text-accent">{kicker}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {body ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{body}</p> : null}
    </header>
  );
}

export function choiceClass(active: boolean) {
  return cn(
    "h-11 rounded-xl border px-3 text-sm font-medium transition-colors",
    active ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-muted hover:text-fg",
  );
}
