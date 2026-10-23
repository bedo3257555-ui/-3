import { Link, useRouterState } from "@tanstack/react-router";
import {
  Camera,
  Dumbbell,
  FileText,
  LayoutDashboard,
  Moon,
  Pill,
  Ruler,
  Sparkles,
  Sun,
  Utensils,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { DOSES } from "@/lib/clinical";
import { hhmmToMinutes, minutesNow, todayISO } from "@/lib/format";
import { useProtocol } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui";

const NAV = [
  { to: "/", label: "اللوحة", icon: LayoutDashboard },
  { to: "/nutrition", label: "الغذاء", icon: Utensils },
  { to: "/meds", label: "الدواء", icon: Pill },
  { to: "/training", label: "التمرين", icon: Dumbbell },
  { to: "/measures", label: "القياسات", icon: Ruler },
  { to: "/photos", label: "الصور", icon: Camera },
  { to: "/sleep", label: "النوم", icon: Moon },
  { to: "/insights", label: "التحليل", icon: Sparkles },
  { to: "/dossier", label: "الملف", icon: FileText },
] as const;

const MOBILE = NAV.slice(0, 4);

function active(path: string, to: string) {
  if (to === "/") return path === "/";
  return path === to;
}

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const hydrated = useHydrated();
  const [more, setMore] = useState(false);
  const [dark, setDark] = useState(true);
  const doses = useProtocol((s) => s.doses);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (!hydrated || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const tick = () => {
      const now = new Date();
      const date = todayISO(now);
      const mins = minutesNow(now);
      for (const dose of DOSES) {
        const at = hhmmToMinutes(dose.time);
        if (mins < at || mins > at + 20) continue;
        if (doses.some((d) => d.date === date && d.doseId === dose.id)) continue;
        const key = `shq-notify-${date}-${dose.id}`;
        if (sessionStorage.getItem(key)) continue;
        sessionStorage.setItem(key, "1");
        try {
          new Notification("شرقاوي", { body: `${dose.name} — ${dose.detail}`, lang: "ar" });
        } catch {
          /* notification may be blocked after permission races */
        }
      }
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [doses, hydrated]);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("shq-theme", next ? "dark" : "light");
    setDark(next);
  }

  const moreActive = NAV.slice(4).some((item) => active(path, item.to));

  return (
    <div className="min-h-screen bg-bg text-fg">
      <aside className="fixed inset-y-0 right-0 z-20 hidden w-64 flex-col border-l border-line bg-surface/95 px-4 py-5 backdrop-blur-md lg:flex">
        <Brand />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} label={item.label} icon={item.icon} active={active(path, item.to)} />
          ))}
        </nav>
        <p className="px-2 text-xs leading-5 text-faint">
          عبد الرحمن إبراهيم الشرقاوي
          <br />
          22 سنة · 178 سم
        </p>
      </aside>

      <div className="lg:pr-64">
        <header className="no-print sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-bg/85 px-4 backdrop-blur-md">
          <div className="lg:hidden">
            <Brand compact />
          </div>
          <p className="hidden text-sm text-muted lg:block">ملف خاص · لا يغادر هذا الجهاز</p>
          <button
            className="grid size-11 place-items-center rounded-xl border border-line bg-surface text-fg"
            onClick={toggleTheme}
            aria-label={dark ? "الوضع الفاتح" : "الوضع الداكن"}
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-5 pb-28 lg:pb-12">
          <div className="rise">{hydrated ? children : <Skeleton />}</div>
        </main>
      </div>

      <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 px-1 pb-1 backdrop-blur-md lg:hidden">
        {MOBILE.map((item) => (
          <NavLink key={item.to} to={item.to} label={item.label} icon={item.icon} active={active(path, item.to)} compact />
        ))}
        <button
          className={cn(
            "flex h-14 flex-col items-center justify-center gap-1 text-xs",
            moreActive || more ? "text-accent" : "text-muted",
          )}
          onClick={() => setMore(true)}
        >
          <Sparkles className="size-5" />
          المزيد
        </button>
      </nav>

      {more ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-ink/70" aria-label="إغلاق" onClick={() => setMore(false)} />
          <div className="absolute inset-x-0 bottom-16 rounded-t-3xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">بقية السجل</p>
              <button className="grid size-11 place-items-center" onClick={() => setMore(false)} aria-label="إغلاق">
                <X className="size-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {NAV.slice(4).map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMore(false)}
                  className={cn(
                    "flex h-14 items-center gap-2 rounded-xl border px-3 text-sm font-medium",
                    active(path, item.to) ? "border-accent bg-accent-soft text-accent" : "border-line",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-1">
      <span className="grid size-9 place-items-center rounded-xl bg-ink text-sm font-semibold text-accent">ش</span>
      <div>
        <p className="text-sm font-semibold leading-none">شرقاوي</p>
        {compact ? null : <p className="mt-1 text-xs text-muted">المتابعة العلاجية</p>}
      </div>
    </div>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  active: on,
  compact = false,
}: {
  to: (typeof NAV)[number]["to"];
  label: string;
  icon: (typeof NAV)[number]["icon"];
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        compact
          ? "flex h-14 flex-col items-center justify-center gap-1 text-xs"
          : "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium",
        on ? "text-accent" : "text-muted",
        !compact && on && "bg-accent-soft",
        !compact && !on && "hover:bg-surface-2 hover:text-fg",
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}
