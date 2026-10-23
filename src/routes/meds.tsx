import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DOSES, type DoseDef } from "@/lib/clinical";
import { dayAdherence, doseMap, isDoseDue, weeklyAdherence } from "@/lib/analytics";
import { formatShort, lastNDates, todayISO } from "@/lib/format";
import { useProtocol } from "@/lib/store";
import { Shell } from "@/components/shell";
import { Card, DateBar, Meter, PageIntro } from "@/components/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/meds")({
  component: MedsPage,
});

function MedsPage() {
  const state = useProtocol();
  const focus = state.focusDate;
  const map = doseMap(state.doses, focus);
  const today = dayAdherence(state.doses, focus);
  const week = weeklyAdherence(state.doses, focus);
  const [perm, setPerm] = useState("unknown");

  useEffect(() => {
    if (typeof Notification === "undefined") setPerm("unsupported");
    else setPerm(Notification.permission);
  }, []);

  const missed = lastNDates(focus, 14).flatMap((date) => {
    if (date >= todayISO()) return [];
    const logs = state.doses.filter((d) => d.date === date);
    if (!logs.length) return [];
    const dayMap = doseMap(state.doses, date);
    return DOSES.filter((dose) => dayMap.get(dose.id)?.status === "missed" || !dayMap.has(dose.id)).map((dose) => ({
      date,
      dose,
      explicit: dayMap.get(dose.id)?.status === "missed",
    }));
  });

  async function enableReminders() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPerm(result);
  }

  function markDue() {
    for (const dose of DOSES) {
      if (!isDoseDue(dose, focus)) continue;
      if (map.get(dose.id)) continue;
      state.setDose(focus, dose.id, "taken");
    }
  }

  return (
    <Shell>
      <PageIntro
        kicker="روشتة 1 سبتمبر 2026"
        title="الدواء والمكملات"
        body="15 جرعة في اليوم: ديجستوزيم وكولوفيرين ثلاث مرات، وببتامين صباحًا ومساءً. التذكير يعمل على هذا الجهاز إذا سمحت به."
      />
      <DateBar />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-muted">التزام اليوم</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {today.relevant ? `${Math.round(today.ratio * 100)}%` : "—"}
          </p>
          <p className="text-xs text-muted">
            {today.taken} تم من {today.relevant || "—"} مستحق
          </p>
          <div className="mt-3">
            <Meter value={today.taken} max={today.relevant || 1} />
          </div>
        </Card>
        <Card>
          <p className="text-xs text-muted">أسبوع الأيام المسجّلة</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {week.ratio == null ? "—" : `${Math.round(week.ratio * 100)}%`}
          </p>
          <p className="text-xs text-muted">{week.loggedDays} أيام فيها سجل من 7</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">تذكير الجهاز</p>
          <p className="mt-1 text-sm font-medium">
            {perm === "granted" ? "مفعّل خلال 20 دقيقة من الموعد" : perm === "denied" ? "مرفوض من المتصفح" : "غير مفعّل"}
          </p>
          {perm === "default" ? (
            <button className="mt-3 h-11 rounded-xl bg-accent px-3 text-sm font-medium text-accent-fg" onClick={() => void enableReminders()}>
              تفعيل التذكير
            </button>
          ) : null}
          <button className="mt-3 h-11 w-full rounded-xl border border-line text-sm font-medium" onClick={markDue}>
            تسجيل كل المستحق كـ تم
          </button>
        </Card>
      </div>

      <DoseSection title="أدوية" kind="med" focus={focus} map={map} />
      <DoseSection title="مكملات" kind="supp" focus={focus} map={map} />

      <Card className="mt-4">
        <p className="text-sm font-semibold">فائت وغير مسجّل · 14 يومًا</p>
        <p className="mt-1 text-xs text-muted">لا نحتسب يومًا فائتًا إلا إذا كان فيه تسجيل جزئي، حتى لا يُختلق أسبوع فارغ.</p>
        {missed.length === 0 ? (
          <p className="mt-4 text-sm text-muted">لا جرعات فائتة في الأيام التي سجّلت فيها.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {missed.map((row) => (
              <li key={`${row.date}-${row.dose.id}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium" dir="ltr">
                    {row.dose.name}
                  </p>
                  <p className="text-xs text-muted">
                    {formatShort(row.date)} · {row.explicit ? "مُعلَّمة فائتة" : "لم تُسجَّل"} · {row.dose.detail}
                  </p>
                </div>
                <button
                  className="h-11 rounded-xl bg-accent-soft px-3 text-xs font-medium text-accent"
                  onClick={() => state.setDose(row.date, row.dose.id, "taken")}
                >
                  تم لاحقًا
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Shell>
  );
}

function DoseSection({
  title,
  kind,
  focus,
  map,
}: {
  title: string;
  kind: DoseDef["kind"];
  focus: string;
  map: ReturnType<typeof doseMap>;
}) {
  const setDose = useProtocol((s) => s.setDose);
  const rows = DOSES.filter((d) => d.kind === kind);
  return (
    <section className="mt-4">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <div className="space-y-2">
        {rows.map((dose) => {
          const log = map.get(dose.id);
          const due = isDoseDue(dose, focus);
          return (
            <Card key={dose.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold" dir="ltr">
                  {dose.name}
                </p>
                <p className="text-xs text-muted">
                  {dose.when} · {dose.detail}
                  {due ? "" : " · لم يحن موعدها"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className={cn(
                    "h-11 rounded-xl px-3 text-sm font-medium",
                    log?.status === "taken" ? "bg-accent text-accent-fg" : "border border-line",
                  )}
                  onClick={() => setDose(focus, dose.id, log?.status === "taken" ? null : "taken")}
                >
                  تم
                </button>
                <button
                  className={cn(
                    "h-11 rounded-xl px-3 text-sm font-medium",
                    log?.status === "missed" ? "bg-fg text-bg" : "border border-line text-muted",
                  )}
                  onClick={() => setDose(focus, dose.id, log?.status === "missed" ? null : "missed")}
                >
                  فائت
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
