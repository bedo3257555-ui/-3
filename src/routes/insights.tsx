import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Lightbulb, Sparkles, Trophy } from "lucide-react";
import { buildInsights, monthlySnapshot } from "@/lib/analytics";
import { formatMonth, num, todayISO } from "@/lib/format";
import { useProtocol } from "@/lib/store";
import { Shell } from "@/components/shell";
import { Card, PageIntro } from "@/components/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/insights")({
  component: InsightsPage,
});

const TONE = {
  win: { icon: Trophy, label: "إنجاز" },
  insight: { icon: Sparkles, label: "قراءة" },
  warn: { icon: AlertTriangle, label: "تنبيه" },
  tip: { icon: Lightbulb, label: "اقتراح" },
} as const;

function InsightsPage() {
  const state = useProtocol();
  const insights = buildInsights(state);
  const month = (state.focusDate || todayISO()).slice(0, 7);
  const report = monthlySnapshot(state, month);

  return (
    <Shell>
      <PageIntro
        kicker="تحليل القواعد"
        title="ماذا يقول السجل"
        body="قواعد ثابتة على بياناتك: لا نموذج لغوي، ولا أرقام مخترعة. التنبيه يظهر فقط عندما يكفي السجل."
      />
      <div className="space-y-3">
        {insights.map((item) => {
          const tone = TONE[item.tone];
          const Icon = tone.icon;
          return (
            <Card key={item.id} className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-xs font-medium text-accent">{tone.label}</p>
                <h2 className="mt-1 text-base font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-muted">{item.body}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-accent">تقرير الشهر</p>
            <h2 className="text-lg font-semibold">{formatMonth(month)}</h2>
          </div>
          <button className="no-print h-11 rounded-xl border border-line px-3 text-sm" onClick={() => window.print()}>
            طباعة
          </button>
        </div>
        <div className={cn("mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3")}>
          <Stat label="أيام غذاء" value={String(report.foodDays)} hint={report.foodRatio == null ? "—" : `${Math.round(report.foodRatio * 100)}% اكتمال`} />
          <Stat label="أيام دواء" value={String(report.doseDays)} hint={report.doseRatio == null ? "—" : `${Math.round(report.doseRatio * 100)}%`} />
          <Stat label="متوسط الماء" value={report.waterAvg == null ? "—" : num(report.waterAvg, 0)} hint="مل في أيام التسجيل" />
          <Stat label="حديد / مشي" value={`${report.lifts} / ${report.walks}`} hint={`${num(report.volume, 0)} حجم`} />
          <Stat label="ليالي نوم" value={String(report.sleepNights)} hint={report.sleepHours == null ? "—" : `${num(report.sleepHours, 1)} س`} />
          <Stat label="نتيجة النوم" value={report.sleepScore == null ? "—" : String(Math.round(report.sleepScore))} hint="من 100" />
        </div>
        <div className="mt-4 text-sm leading-7 text-muted">
          {report.prs.length ? (
            <p>
              أفضل تقدير 1RM سُجّل هذا الشهر:{" "}
              {report.prs
                .slice(0, 3)
                .map((p) => `${p.name} ${num(p.e1rm, 1)}`)
                .join(" · ")}
              .
            </p>
          ) : (
            <p>لا جلسات حديد بأوزان هذا الشهر بعد. التقرير يمتلئ مع التسجيل، بينما قراءات InBody تبقى المرجع حتى القياس التالي.</p>
          )}
        </div>
      </Card>
    </Shell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-faint">{hint}</p>
    </div>
  );
}
