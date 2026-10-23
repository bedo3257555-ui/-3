import { createFileRoute, Link } from "@tanstack/react-router";
import { DOSES, EXCHANGE_LABEL, EXCHANGES, INBODY, PROFILE, TARGETS, type ExchangeKey } from "@/lib/clinical";
import {
  buildInsights,
  dayAdherence,
  dayNutrition,
  heatmap,
  latestMeasurement,
  previousMeasurement,
  waterStreak,
  waterTotal,
  weekTraining,
  weeklySleep,
} from "@/lib/analytics";
import { formatHours, lastNDates, num, todayISO } from "@/lib/format";
import { sleepScore } from "@/lib/analytics";
import { useProtocol } from "@/lib/store";
import { Shell } from "@/components/shell";
import { TrendChart } from "@/components/charts";
import { Card, DateBar, Delta, Kpi, Meter, PageIntro, Ring } from "@/components/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const EX_KEYS: ExchangeKey[] = ["meat", "starch", "veg", "fruit", "dairy", "fat"];

function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "صباح الخير";
  if (h < 17) return "يومك سعيد";
  return "مساء الخير";
}

function Dashboard() {
  const state = useProtocol();
  const focus = state.focusDate;
  const food = dayNutrition(state.groups, focus);
  const meds = dayAdherence(state.doses, focus);
  const water = waterTotal(state.water, focus);
  const streak = waterStreak(state.water, focus);
  const training = weekTraining(state.sessions, focus);
  const weight = latestMeasurement(state.measurements, "weight");
  const prevWeight = previousMeasurement(state.measurements, "weight");
  const fat = latestMeasurement(state.measurements, "pbf");
  const prevFat = previousMeasurement(state.measurements, "pbf");
  const muscle = latestMeasurement(state.measurements, "smm");
  const prevMuscle = previousMeasurement(state.measurements, "smm");
  const sleepLog = [...state.sleep].filter((s) => s.date <= focus).sort((a, b) => b.date.localeCompare(a.date))[0];
  const sleep = sleepLog ? sleepScore(sleepLog) : null;
  const weekSleep = weeklySleep(state.sleep, focus);
  const insights = buildInsights(state, new Date()).slice(0, 3);
  const cells = heatmap({
    end: focus,
    weeks: 8,
    groups: state.groups,
    doses: state.doses,
    water: state.water,
    sessions: state.sessions,
    sleep: state.sleep,
  });
  const due = DOSES.filter((d) => {
    const log = state.doses.find((x) => x.date === focus && x.doseId === d.id);
    return !log && (focus < todayISO() || d.time <= `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`);
  }).slice(0, 3);
  const points = [...state.measurements]
    .filter((m) => typeof m.weight === "number")
    .map((m, i) => ({
      label: m.date ? m.date.slice(5) : m.label,
      value: m.weight as number,
      i,
    }));
  const note = state.notes.find((n) => n.date === focus)?.text ?? "";
  const fatMass = weight?.weight && fat?.pbf ? (weight.weight * fat.pbf) / 100 : INBODY.fatMass.value;

  return (
    <Shell>
      <PageIntro
        kicker={PROFILE.clinic}
        title={`${greeting()}، ${PROFILE.short}`}
        body={`${PROFILE.name} · ${PROFILE.heightCm} سم · InBody ${INBODY.score}/100 · الهدف ${TARGETS.weightGoal} كجم بخفض دهون ${Math.abs(TARGETS.fatControlKg)} كجم.`}
      />
      <DateBar />

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi
          label="الوزن"
          value={num(weight?.weight ?? INBODY.weight.value, 1)}
          unit="كجم"
          hint={<Delta now={weight?.weight} prev={prevWeight?.weight} prefer="down" />}
        />
        <Kpi
          label="نسبة الدهون"
          value={num(fat?.pbf ?? INBODY.pbf, 1)}
          unit="%"
          hint={<Delta now={fat?.pbf} prev={prevFat?.pbf} prefer="down" />}
        />
        <Kpi
          label="الكتلة العضلية"
          value={num(muscle?.smm ?? INBODY.smm, 1)}
          unit="كجم"
          hint={<Delta now={muscle?.smm} prev={prevMuscle?.smm} prefer="up" />}
        />
        <Kpi
          label="سعرات الطعام"
          value={num(food.kcal, 0)}
          unit={`/ ${num(TARGETS.kcal)}`}
          hint={`${food.doneCount}/${food.totalCount} كتل غذائية`}
        />
        <Kpi label="البروتين" value={num(food.protein, 0)} unit={`/ ${TARGETS.protein} جم`} hint="من الطعام فقط، بدون الواي" />
        <Kpi
          label="الماء"
          value={num(water / 1000, 2)}
          unit="/ 2 لتر"
          hint={streak ? `سلسلة ${streak} يوم` : "الهدف 8 مرات يوميًا"}
        />
        <Kpi
          label="تمرين الأسبوع"
          value={`${training.lifts}/4`}
          hint={`${training.walks}/5 مشي · ${num(training.volume, 0)} حجم`}
        />
        <Kpi
          label="التزام الجرعات"
          value={meds.relevant ? `${Math.round(meds.ratio * 100)}%` : "—"}
          hint={meds.relevant ? `${meds.taken} من ${meds.relevant} مستحق` : "لا جرعات مستحقة بعد"}
        />
        <Kpi
          label="النوم"
          value={sleep ? String(sleep.score) : "—"}
          unit={sleep ? "/ 100" : undefined}
          hint={
            sleep
              ? `${formatHours(sleep.hours)}${weekSleep.avgScore ? ` · أسبوع ${Math.round(weekSleep.avgScore)}` : ""}`
              : "لم يُسجَّل بعد"
          }
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">الماء اليوم</p>
              <p className="mt-1 text-xs text-muted">كتلة الدهون الحالية حوالي {num(fatMass, 1)} كجم</p>
            </div>
            <Ring value={water / TARGETS.waterMl} caption={`${Math.round((water / TARGETS.waterMl) * 100)}%`} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[200, 250, 300, 500].map((ml) => (
              <button
                key={ml}
                className="h-11 rounded-xl bg-accent-soft px-3 text-sm font-medium text-accent"
                onClick={() => state.addWater(focus, ml)}
              >
                +{ml} مل
              </button>
            ))}
          </div>
          <Meter value={water} max={TARGETS.waterMl} />
          <div className="mt-4 grid grid-cols-7 gap-1" dir="ltr">
            {lastNDates(focus, 7).map((date) => {
              const ml = waterTotal(state.water, date);
              const pct = Math.max(ml > 0 ? 8 : 0, Math.min(100, (ml / TARGETS.waterMl) * 100));
              return (
                <div key={date} className="text-center">
                  <div className="mx-auto flex h-16 w-full max-w-6 flex-col justify-end overflow-hidden rounded-full bg-surface-2">
                    <div className="w-full rounded-full bg-accent" style={{ height: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-faint">{date.slice(8)}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">الجرعة التالية</p>
            <Link to="/meds" className="text-xs font-medium text-accent">
              السجل الدوائي
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {(due.length ? due : DOSES.slice(0, 3)).map((dose) => {
              const log = state.doses.find((d) => d.date === focus && d.doseId === dose.id);
              return (
                <li key={dose.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium" dir="ltr">
                      {dose.name}
                    </p>
                    <p className="text-xs text-muted">{dose.detail}</p>
                  </div>
                  <button
                    className={cn(
                      "h-11 shrink-0 rounded-xl px-3 text-sm font-medium",
                      log?.status === "taken" ? "bg-accent text-accent-fg" : "bg-accent-soft text-accent",
                    )}
                    onClick={() => state.setDose(focus, dose.id, log?.status === "taken" ? null : "taken")}
                  >
                    {log?.status === "taken" ? "تم" : dose.when}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <p className="text-sm font-semibold">مسار الوزن</p>
          <p className="mt-1 text-xs text-muted">ثلاث قراءات موثّقة، ثم أي قياس تسجّله.</p>
          <div className="mt-2">
            <TrendChart data={points.map((p) => ({ label: p.label, value: p.value }))} unit="كجم" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {state.measurements
              .filter((m) => m.source === "inbody")
              .map((m) => (
                <div key={m.id} className="rounded-xl bg-surface-2 px-2 py-2">
                  <p className="text-xs text-muted">{m.label}</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">{num(m.weight ?? 0, 1)}</p>
                  <p className="text-xs text-faint">
                    عضل {num(m.smm ?? 0, 1)} · دهون {num(m.pbf ?? 0, 1)}%
                  </p>
                </div>
              ))}
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">قراءة التحليل</p>
            <Link to="/insights" className="text-xs font-medium text-accent">
              الكل
            </Link>
          </div>
          <ul className="mt-3 space-y-3">
            {insights.map((item) => (
              <li key={item.id} className="border-r-2 border-accent pr-3">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">حصص اليوم</p>
            <p className="text-xs text-muted">جدول 13 يونيو 2026. إتمام الكتلة يملأ نصيبها.</p>
          </div>
          <Link to="/nutrition" className="text-xs font-medium text-accent">
            الوجبات
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {EX_KEYS.map((key) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-xs">
                <span>{EXCHANGE_LABEL[key]}</span>
                <span className="tabular-nums text-muted">
                  {num(food.exchanges[key], 1)} / {EXCHANGES[key]}
                </span>
              </div>
              <Meter value={food.exchanges[key]} max={EXCHANGES[key]} />
            </div>
          ))}
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span>بقوليات</span>
              <span className="text-muted">0 — ليست حصة مستقلة</span>
            </div>
            <Meter value={0} max={1} />
          </div>
        </div>
      </Card>

      <Card className="mt-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">خريطة الالتزام · 8 أسابيع</p>
          <p className="text-xs text-faint">ماء · دواء · غذاء · تمرين</p>
        </div>
        <div className="mt-3 grid max-w-md grid-cols-7 gap-1.5 text-center text-xs text-faint">
          {["س", "ح", "ن", "ث", "ر", "خ", "ج"].map((d) => (
            <span key={d}>{d}</span>
          ))}
          {cells.map((cell) => (
            <button
              key={cell.date}
              disabled={cell.date > todayISO()}
              onClick={() => state.setFocusDate(cell.date)}
              aria-label={cell.date}
              className={cn(
                "aspect-square w-full rounded-md",
                cell.date === focus && "ring-2 ring-accent ring-offset-2 ring-offset-surface",
                cell.score == null && "bg-surface-2",
                cell.score === 0 && "bg-accent/15",
                cell.score === 1 && "bg-accent/35",
                cell.score === 2 && "bg-accent/55",
                cell.score === 3 && "bg-accent/75",
                cell.score === 4 && "bg-accent",
              )}
            />
          ))}
        </div>
      </Card>

      <Card className="mt-3">
        <label className="text-sm font-semibold" htmlFor="day-note">
          ملاحظة اليوم
        </label>
        <textarea
          id="day-note"
          value={note}
          onChange={(e) => state.setNote(focus, e.target.value)}
          rows={3}
          placeholder="هضم، طاقة، ألم كوع، أي خروج عن القائمة…"
          className="mt-3 w-full resize-none rounded-xl border border-line bg-bg px-3 py-3 text-sm outline-none focus:border-accent"
        />
      </Card>
    </Shell>
  );
}
