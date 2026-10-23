import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { INBODY, MEASURE_RANGES, SEGMENT_FAT, SEGMENT_LEAN } from "@/lib/clinical";
import { latestMeasurement, orderedMeasurements } from "@/lib/analytics";
import { formatShort, num, todayISO } from "@/lib/format";
import { useProtocol, type Measurement } from "@/lib/store";
import { uid } from "@/lib/utils";
import { Shell } from "@/components/shell";
import { TrendChart } from "@/components/charts";
import { Card, Empty, PageIntro, choiceClass } from "@/components/ui";

export const Route = createFileRoute("/measures")({
  component: MeasuresPage,
});

type Metric = "weight" | "pbf" | "smm" | "waist" | "chest" | "arm" | "thigh";

const METRICS: { id: Metric; label: string; unit: string }[] = [
  { id: "weight", label: "الوزن", unit: "كجم" },
  { id: "pbf", label: "نسبة الدهون", unit: "%" },
  { id: "smm", label: "العضل", unit: "كجم" },
  { id: "waist", label: "الخصر", unit: "سم" },
  { id: "chest", label: "الصدر", unit: "سم" },
  { id: "arm", label: "الذراع", unit: "سم" },
  { id: "thigh", label: "الفخذ", unit: "سم" },
];

const FIELDS: { key: Metric; label: string }[] = [
  { key: "weight", label: "الوزن كجم" },
  { key: "waist", label: "الخصر سم" },
  { key: "chest", label: "الصدر سم" },
  { key: "arm", label: "الذراع سم" },
  { key: "thigh", label: "الفخذ سم" },
  { key: "pbf", label: "الدهون %" },
  { key: "smm", label: "العضل كجم" },
];

function MeasuresPage() {
  const state = useProtocol();
  const [metric, setMetric] = useState<Metric>("weight");
  const [form, setForm] = useState<Record<Metric, string>>({
    weight: "",
    pbf: "",
    smm: "",
    waist: "",
    chest: "",
    arm: "",
    thigh: "",
  });
  const [date, setDate] = useState(state.focusDate || todayISO());
  const [error, setError] = useState("");
  const meta = METRICS.find((m) => m.id === metric) ?? METRICS[0];
  const points = orderedMeasurements(state.measurements)
    .filter((m) => typeof m[metric] === "number")
    .map((m) => ({ label: m.date ? formatShort(m.date) : m.label, value: m[metric] as number }));
  const latest = latestMeasurement(state.measurements, metric);

  function save() {
    const row: Measurement = { id: uid(), date, label: formatShort(date), source: "manual" };
    let any = false;
    for (const field of FIELDS) {
      const raw = form[field.key].trim();
      if (!raw) continue;
      const n = Number(raw);
      const [min, max] = MEASURE_RANGES[field.key];
      if (!Number.isFinite(n) || n < min || n > max) {
        setError(`${field.label} خارج المدى المعقول (${min}–${max}).`);
        return;
      }
      row[field.key] = n;
      any = true;
    }
    if (!any) {
      setError("أدخل قياسًا واحدًا على الأقل.");
      return;
    }
    setError("");
    state.addMeasurement(row);
    setForm({ weight: "", pbf: "", smm: "", waist: "", chest: "", arm: "", thigh: "" });
  }

  return (
    <Shell>
      <PageIntro
        kicker={`InBody120 · ${INBODY.score}/100 · 29 يوليو 2026`}
        title="القياسات"
        body="القراءات الثلاث من الملف مثبتة. أي قياس جديد للخصر والصدر والذراع والفخذ يُرسم مع الوزن والدهون والعضل."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="BMI" value={String(INBODY.bmi)} />
        <Stat label="BMR" value={String(INBODY.bmr)} unit="سعر" />
        <Stat label="دهون حشوية" value={String(INBODY.visceral)} unit="من 1–9" />
        <Stat label="الهدف" value={String(INBODY.targetWeight)} unit="كجم" />
      </div>

      <Card className="mt-3">
        <div className="flex flex-wrap gap-2">
          {METRICS.map((item) => (
            <button key={item.id} className={choiceClass(metric === item.id)} onClick={() => setMetric(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          آخر قيمة: {latest && typeof latest[metric] === "number" ? `${num(latest[metric] as number, 1)} ${meta.unit}` : "لا قياس بعد"}
        </p>
        {points.length ? <TrendChart data={points} unit={meta.unit} /> : <Empty title="لا نقاط بعد" body="سجّل القياس من النموذج بالأسفل." />}
      </Card>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <SegmentCard title="العضل القطاعي" rows={SEGMENT_LEAN} />
        <SegmentCard title="الدهون القطاعية" rows={SEGMENT_FAT} />
      </div>

      <Card className="mt-3 overflow-x-auto">
        <p className="text-sm font-semibold">تكوين الجسم · 29.07.2026</p>
        <table className="mt-2 w-full min-w-[28rem] text-right text-sm">
          <tbody>
            {[
              ["ماء الجسم", `${INBODY.tbw.value} لتر`, `${INBODY.tbw.low}–${INBODY.tbw.high}`],
              ["البروتين", `${INBODY.protein.value} كجم`, `${INBODY.protein.low}–${INBODY.protein.high}`],
              ["المعادن", `${INBODY.minerals.value} كجم`, `${INBODY.minerals.low}–${INBODY.minerals.high}`],
              ["كتلة الدهون", `${INBODY.fatMass.value} كجم`, `${INBODY.fatMass.low}–${INBODY.fatMass.high}`],
              ["الوزن", `${INBODY.weight.value} كجم`, `${INBODY.weight.low}–${INBODY.weight.high}`],
              ["بدون دهون", `${INBODY.ffm.value} كجم`, `${INBODY.ffm.low}–${INBODY.ffm.high}`],
              ["معادن العظام", `${INBODY.bmc.value} كجم`, `${INBODY.bmc.low}–${INBODY.bmc.high}`],
              ["الخصر/الورك", String(INBODY.whr), `${INBODY.whrLow}–${INBODY.whrHigh}`],
              ["درجة السمنة", `${INBODY.obesityDegree}%`, "90–110"],
            ].map((row) => (
              <tr key={row[0]} className="border-t border-line">
                <td className="py-2">{row[0]}</td>
                <td className="tabular-nums">{row[1]}</td>
                <td className="text-muted">{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted">
          التحكم: وزن {INBODY.weightControl} كجم · دهون {INBODY.fatControl} · عضل {INBODY.muscleControl}. المعاوقة محفوظة في الملف الطبي.
        </p>
      </Card>

      <Card className="mt-3">
        <p className="text-sm font-semibold">قياس جديد</p>
        <label className="mt-3 block text-xs text-muted" htmlFor="m-date">
          التاريخ
        </label>
        <input
          id="m-date"
          type="date"
          dir="ltr"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 h-11 rounded-xl border border-line bg-bg px-3 text-sm"
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <label key={field.key} className="text-xs text-muted">
              {field.label}
              <input
                inputMode="decimal"
                dir="ltr"
                value={form[field.key]}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm text-fg"
              />
            </label>
          ))}
        </div>
        {error ? <p className="mt-2 text-sm text-accent">{error}</p> : null}
        <button className="mt-4 h-11 rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg" onClick={save}>
          حفظ القياس
        </button>
      </Card>

      <ul className="mt-3 space-y-2">
        {orderedMeasurements(state.measurements)
          .slice()
          .reverse()
          .map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{m.date ? formatShort(m.date) : m.label}</p>
                <p className="text-xs text-muted">
                  {[
                    m.weight != null ? `وزن ${num(m.weight, 1)}` : "",
                    m.pbf != null ? `دهون ${num(m.pbf, 1)}%` : "",
                    m.smm != null ? `عضل ${num(m.smm, 1)}` : "",
                    m.waist != null ? `خصر ${num(m.waist, 1)}` : "",
                    m.chest != null ? `صدر ${num(m.chest, 1)}` : "",
                    m.arm != null ? `ذراع ${num(m.arm, 1)}` : "",
                    m.thigh != null ? `فخذ ${num(m.thigh, 1)}` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {m.source === "manual" ? (
                <button className="h-11 px-2 text-xs text-muted" onClick={() => state.deleteMeasurement(m.id)}>
                  حذف
                </button>
              ) : (
                <span className="text-xs text-faint">InBody</span>
              )}
            </li>
          ))}
      </ul>
    </Shell>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <Card>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {value} {unit ? <span className="text-xs font-normal text-muted">{unit}</span> : null}
      </p>
    </Card>
  );
}

function SegmentCard({ title, rows }: { title: string; rows: typeof SEGMENT_LEAN }) {
  return (
    <Card>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-3">
        {rows.map((row) => {
          const n = Number(row.percent.replace("%", ""));
          const width = Number.isFinite(n) ? Math.max(8, Math.min(100, (n / 140) * 100)) : 36;
          return (
            <li key={row.region}>
              <div className="flex justify-between text-xs">
                <span>{row.region}</span>
                <span className="text-muted">
                  {row.mass} · {row.percent} · {row.status === "Over" ? "فوق المدى" : "طبيعي"}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-accent" style={{ width: `${width}%`, opacity: row.status === "Over" ? 1 : 0.55 }} />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
