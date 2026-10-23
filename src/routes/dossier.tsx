import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ALLOWED,
  DOSES,
  EXCHANGES,
  FORBIDDEN,
  INBODY,
  PROFILE,
  TARGETS,
  TRAINING_RULES,
} from "@/lib/clinical";
import { makeBackup, readBackup, useProtocol } from "@/lib/store";
import { clearPhotoBlobs } from "@/lib/photos";
import { todayISO } from "@/lib/format";
import { Shell } from "@/components/shell";
import { Card, PageIntro } from "@/components/ui";

export const Route = createFileRoute("/dossier")({
  component: DossierPage,
});

function DossierPage() {
  const resetLogs = useProtocol((s) => s.resetLogs);
  const replaceAll = useProtocol((s) => s.replaceAll);
  const [message, setMessage] = useState("");

  function exportJson() {
    const blob = new Blob([JSON.stringify(makeBackup(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sharqawi-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMessage("تم تنزيل النسخة. الصور تبقى في المتصفح وليست داخل الملف.");
  }

  function onImport(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = readBackup(JSON.parse(String(reader.result)));
        if (!parsed) {
          setMessage("الملف ليس نسخة شرقاوي.");
          return;
        }
        replaceAll(parsed);
        setMessage("استُعيد السجل.");
      } catch {
        setMessage("تعذّر قراءة الملف.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <Shell>
      <PageIntro
        kicker={PROFILE.doctor}
        title="الملف الغذائي والعلاجي"
        body={`${PROFILE.name} · ${PROFILE.age} سنة · ${PROFILE.sex} · ${PROFILE.heightCm} سم. ${PROFILE.credential}. ${PROFILE.clinic}.`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Mini label="تاريخ الروشتة" value="1 سبتمبر 2026" />
        <Mini label="تاريخ النظام" value="13 يونيو 2026" />
        <Mini label="InBody" value={`${INBODY.score}/100 · 29 يوليو`} />
      </div>

      <Card className="mt-3 overflow-x-auto">
        <h2 className="text-sm font-semibold">الروشتة</h2>
        <table className="mt-2 w-full min-w-[28rem] text-right text-sm">
          <tbody>
            {DOSES.map((dose, i) => (
              <tr key={dose.id} className="border-t border-line">
                <td className="py-2 text-muted">{i + 1}</td>
                <td className="font-medium" dir="ltr">
                  {dose.name}
                </td>
                <td className="text-muted">{dose.detail}</td>
                <td>{dose.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="mt-3">
        <h2 className="text-sm font-semibold">الحصص اليومية</h2>
        <p className="mt-2 text-sm text-muted">
          {TARGETS.kcal.toLocaleString("en-US")} سعر · بروتين {TARGETS.protein} جم · نشويات {EXCHANGES.starch} · خضار{" "}
          {EXCHANGES.veg} · فاكهة {EXCHANGES.fruit} · بقوليات {EXCHANGES.legume} · لحوم {EXCHANGES.meat} · ألبان{" "}
          {EXCHANGES.dairy} · دهون {EXCHANGES.fat}.
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          الفطار 8 صباحًا، الغداء 1–2 مساءً، العشاء 9 مساءً، وبينهما لبن كامل الدسم خالي اللاكتوز وحصة فاكهة. تفاصيل البدائل في صفحة الغذاء كما كتبها الطبيب.
        </p>
      </Card>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold">المسموح</h2>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
            {ALLOWED.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">الممنوع</h2>
          <ul className="mt-2 space-y-2 text-sm text-muted">
            {FORBIDDEN.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-3">
        <h2 className="text-sm font-semibold">التمرين</h2>
        <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
          {TRAINING_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </Card>

      <Card className="mt-3">
        <h2 className="text-sm font-semibold">نسخة الجهاز</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          السجل الطبي يُحفظ في هذا المتصفح فقط، لأن البيانات حساسة ولا تُنشر في قاعدة مشتركة. نزّل نسخة قبل مسح بيانات الموقع.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="h-11 rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg" onClick={exportJson}>
            تنزيل النسخة
          </button>
          <label className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-line px-4 text-sm">
            استعادة
            <input
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(e) => onImport(e.target.files?.[0])}
            />
          </label>
          <button
            className="h-11 rounded-xl border border-line px-4 text-sm text-muted"
            onClick={() => {
              if (!window.confirm("مسح السجل والعودة لقراءات InBody فقط؟")) return;
              void clearPhotoBlobs();
              resetLogs();
              setMessage("تمت إعادة السجل إلى خط الأساس.");
            }}
          >
            إعادة ضبط
          </button>
        </div>
        {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}
      </Card>

      <details className="mt-4 rounded-2xl border border-line bg-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold">مخطط المنتج وقاعدة البيانات</summary>
        <Blueprint />
      </details>
    </Shell>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </Card>
  );
}

function Blueprint() {
  return (
    <div className="mt-4 space-y-4 text-sm leading-6 text-muted">
      <section>
        <h3 className="font-semibold text-fg">ماذا يغطيه المنتج</h3>
        <p>
          لوحة يومية، غذاء بالحصص، دواء ومكملات مع تذكير الجهاز، تمرين Belghamdi مع 1RM والحجم والأرقام، قياسات، صور قبل/بعد، نوم وارتباطه بالتدريب، وماء بهدف لترين. مستخدم واحد: عبد الرحمن.
        </p>
      </section>
      <section>
        <h3 className="font-semibold text-fg">المعمارية الحالية</h3>
        <p>
          واجهة واحدة على الجهاز. الحالة في المتصفح، والصور في قاعدة المتصفح المحلية، والحسابات دوال خالصة بلا خادم. هذا يحمي الروشتة من أن تكون مقروءة لأي زائر. المزامنة بين الأجهزة مرحلة لاحقة بحساب، لا بقاعدة مفتوحة.
        </p>
      </section>
      <section>
        <h3 className="font-semibold text-fg">الكيانات</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {[
            "Profile",
            "DayNote",
            "DoseLog",
            "MealBlock",
            "WaterLog",
            "SleepLog",
            "Session",
            "SetLog",
            "Measurement",
            "Photo",
            "ExerciseCatalog",
            "Insight",
          ].map((name) => (
            <div key={name} className="rounded-xl border border-line px-3 py-2 text-xs font-medium text-fg" dir="ltr">
              {name}
            </div>
          ))}
        </div>
        <p className="mt-2">
          DoseLog وMealBlock وWaterLog وSleepLog ترتبط باليوم. SetLog يتبع Session. Session يتبع نوع اليوم في الدورة. Photo مستقل بزاوية وتاريخ. ExerciseCatalog ثابت من البرنامج وليس سجلًا.
        </p>
      </section>
      <section>
        <h3 className="font-semibold text-fg">تدفق الاستخدام</h3>
        <ol className="mt-1 list-decimal space-y-1 pr-4">
          <li>فتح اللوحة على تاريخ اليوم وقراءة المؤشرات والقراءة الذكية.</li>
          <li>تسجيل الماء والجرعة المستحقة من اللوحة أو من صفحتيهما.</li>
          <li>تحديد كتل الفطار والغداء والعشاء والفاكهة.</li>
          <li>فتح جلسة الدورة، إدخال الوزن والعدات وRIR وRPE، وإنهاء الجلسة.</li>
          <li>قياس أسبوعي وصورة شهرية لكل زاوية.</li>
          <li>مراجعة التحليل وتقرير الشهر، وتنزيل نسخة JSON.</li>
        </ol>
      </section>
      <section dir="ltr">
        <h3 className="font-semibold text-fg" dir="rtl">
          مخطط Postgres عند تفعيل الحساب
        </h3>
        <pre className="mt-2 overflow-x-auto rounded-xl bg-bg p-3 text-xs leading-5 text-fg">{SQL}</pre>
      </section>
      <section>
        <h3 className="font-semibold text-fg">واجهات لاحقة</h3>
        <p dir="ltr" className="mt-1 text-xs">
          GET/PUT /days/:date · POST /sessions · POST /sets · POST /measurements · POST /photos · GET /insights · GET /reports/:month
        </p>
        <p className="mt-2">
          التذكير اليوم دالة على الجهاز كل دقيقة. لاحقًا دالة مجدولة ترسل إشعارًا لحساب موثّق فقط، دون تخزين الجرعات في سجل عام.
        </p>
      </section>
      <section>
        <h3 className="font-semibold text-fg">الطريق</h3>
        <ul className="mt-1 space-y-1">
          <li>حساب خاص ومزامنة مشفّرة بين الهاتف والكمبيوتر.</li>
          <li>عرض للطبيب أحمد للقراءة فقط، بدعوة.</li>
          <li>تقرير PDF شهري بالصور والقياسات.</li>
          <li>مؤقت راحة يعمل والشاشة مغلقة، واستيراد فيديوهات المدرب عند توفر الروابط.</li>
          <li>InBody التالي يُقارن آليًا بهذه اللقطة في 29 يوليو 2026.</li>
        </ul>
      </section>
    </div>
  );
}

const SQL = `create table profiles (
  user_id uuid primary key,
  full_name text not null,
  height_cm numeric not null,
  birth_year int
);

create table dose_logs (
  user_id uuid not null,
  day date not null,
  dose_id text not null,
  status text not null check (status in ('taken','missed')),
  taken_at timestamptz,
  primary key (user_id, day, dose_id)
);

create table meal_blocks (
  user_id uuid not null,
  day date not null,
  group_id text not null,
  choice text,
  done boolean not null default false,
  primary key (user_id, day, group_id)
);

create table water_logs (
  id uuid primary key,
  user_id uuid not null,
  day date not null,
  ml int not null check (ml > 0)
);

create table sleep_logs (
  user_id uuid not null,
  day date not null,
  bed time not null,
  wake time not null,
  quality int not null check (quality between 1 and 5),
  primary key (user_id, day)
);

create table sessions (
  id uuid primary key,
  user_id uuid not null,
  day date not null,
  kind text not null,
  completed boolean not null default false,
  walk_minutes int,
  note text
);

create table set_logs (
  id uuid primary key,
  session_id uuid not null references sessions(id) on delete cascade,
  exercise_id text not null,
  weight numeric not null,
  reps int not null,
  rir numeric,
  rpe numeric
);

create table measurements (
  id uuid primary key,
  user_id uuid not null,
  day date,
  source text not null,
  weight numeric, waist numeric, chest numeric,
  arm numeric, thigh numeric, pbf numeric, smm numeric
);

create table photos (
  id uuid primary key,
  user_id uuid not null,
  day date not null,
  view text not null check (view in ('front','side','back')),
  storage_path text not null
);`;
