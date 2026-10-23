import {
  CYCLE,
  DOSES,
  EXERCISES,
  EXERCISE_BY_ID,
  FACTORS,
  FOOD_GROUPS,
  INBODY,
  TARGETS,
  WHEY_ESTIMATE,
  type DoseDef,
  type ExerciseDef,
  type ExchangeKey,
  type MuscleKey,
  type SessionKind,
} from "@/lib/clinical";
import { addDays, hhmmToMinutes, lastNDates, minutesNow, sleepHours, todayISO, weekStart } from "@/lib/format";
import type { GroupLog, Measurement, SessionLog, SleepLog, DoseLog, WaterLog, ScreenLog } from "@/lib/store-types";

const FULL_RAW = FOOD_GROUPS.reduce(
  (acc, g) => {
    const f = FACTORS[g.exchange];
    acc.kcal += f.kcal * g.amount;
    acc.p += f.p * g.amount;
    acc.c += f.c * g.amount;
    acc.f += f.f * g.amount;
    return acc;
  },
  { kcal: 0, p: 0, c: 0, f: 0 },
);

const KCAL_SCALE = TARGETS.kcal / FULL_RAW.kcal;
const P_SCALE = TARGETS.protein / FULL_RAW.p;

export interface DayNutrition {
  doneCount: number;
  totalCount: number;
  ratio: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  exchanges: Record<ExchangeKey, number>;
}

export function dayNutrition(groups: GroupLog[], date: string): DayNutrition {
  const done = new Set(groups.filter((g) => g.date === date && g.done).map((g) => g.groupId));
  const exchanges: Record<ExchangeKey, number> = { meat: 0, starch: 0, veg: 0, fruit: 0, dairy: 0, fat: 0 };
  let kcal = 0;
  let p = 0;
  let c = 0;
  let f = 0;
  let doneCount = 0;
  for (const g of FOOD_GROUPS) {
    if (!done.has(g.id)) continue;
    doneCount += 1;
    const factor = FACTORS[g.exchange];
    kcal += factor.kcal * g.amount;
    p += factor.p * g.amount;
    c += factor.c * g.amount;
    f += factor.f * g.amount;
    exchanges[g.exchange] += g.amount;
  }
  const totalCount = FOOD_GROUPS.length;
  return {
    doneCount,
    totalCount,
    ratio: totalCount ? doneCount / totalCount : 0,
    kcal: kcal * KCAL_SCALE,
    protein: p * P_SCALE,
    carbs: c * KCAL_SCALE,
    fat: f * KCAL_SCALE,
    exchanges,
  };
}

export function doseMap(doses: DoseLog[], date: string) {
  const map = new Map<string, DoseLog>();
  for (const d of doses) if (d.date === date) map.set(d.doseId, d);
  return map;
}

export function isDoseDue(dose: DoseDef, date: string, now = new Date()) {
  const today = todayISO(now);
  if (date < today) return true;
  if (date > today) return false;
  return hhmmToMinutes(dose.time) <= minutesNow(now);
}

export interface Adherence {
  taken: number;
  relevant: number;
  missed: number;
  ratio: number;
}

export function dayAdherence(doses: DoseLog[], date: string, now = new Date()): Adherence {
  const map = doseMap(doses, date);
  const today = todayISO(now);
  const relevant = DOSES.filter((d) => {
    if (date < today) return true;
    if (date > today) return map.has(d.id);
    return isDoseDue(d, date, now) || map.has(d.id);
  });
  let taken = 0;
  let missed = 0;
  for (const d of relevant) {
    const log = map.get(d.id);
    if (log?.status === "taken") taken += 1;
    if (log?.status === "missed") missed += 1;
    if (date < today && !log) missed += 1;
  }
  return {
    taken,
    relevant: relevant.length,
    missed,
    ratio: relevant.length ? taken / relevant.length : 0,
  };
}

export function weeklyAdherence(doses: DoseLog[], end: string, now = new Date()) {
  const days = lastNDates(end > todayISO(now) ? todayISO(now) : end, 7);
  const scored = days.map((date) => ({ date, ...dayAdherence(doses, date, now) }));
  const logged = scored.filter((d) => doses.some((x) => x.date === d.date));
  const base = logged.length ? logged : [];
  const ratio = base.length ? base.reduce((a, d) => a + d.ratio, 0) / base.length : null;
  return { days: scored, loggedDays: base.length, ratio };
}

export function waterTotal(water: WaterLog[], date: string) {
  return water.filter((w) => w.date === date).reduce((a, w) => a + w.ml, 0);
}

export function waterStreak(water: WaterLog[], end: string) {
  let streak = 0;
  let cursor = end;
  const today = todayISO();
  if (cursor === today && waterTotal(water, cursor) < TARGETS.waterMl) {
    cursor = addDays(cursor, -1);
  }
  while (waterTotal(water, cursor) >= TARGETS.waterMl) {
    streak += 1;
    cursor = addDays(cursor, -1);
    if (streak > 3650) break;
  }
  return streak;
}

export function weeklyWaterAvg(water: WaterLog[], end: string) {
  const days = lastNDates(end, 7);
  const totals = days.map((date) => waterTotal(water, date));
  return totals.reduce((a, n) => a + n, 0) / days.length;
}

export function epley(weight: number, reps: number) {
  if (!(weight > 0) || !(reps > 0)) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function setVolume(weight: number, reps: number) {
  if (!(weight > 0) || !(reps > 0)) return 0;
  return weight * reps;
}

export function movementName(exerciseId: string) {
  return EXERCISE_BY_ID.get(exerciseId)?.name ?? exerciseId;
}

export function sameMovement(a: string, b: string) {
  if (a === b) return true;
  const na = EXERCISE_BY_ID.get(a)?.name;
  const nb = EXERCISE_BY_ID.get(b)?.name;
  return Boolean(na && na === nb);
}

export interface SetRef {
  sessionId: string;
  date: string;
  exerciseId: string;
  weight: number;
  reps: number;
  e1rm: number;
  volume: number;
}

export function allWorkingSets(sessions: SessionLog[]): SetRef[] {
  const out: SetRef[] = [];
  for (const session of sessions) {
    for (const ex of session.exercises) {
      for (const set of ex.sets) {
        const e1rm = epley(set.weight, set.reps);
        if (e1rm <= 0) continue;
        out.push({
          sessionId: session.id,
          date: session.date,
          exerciseId: ex.exerciseId,
          weight: set.weight,
          reps: set.reps,
          e1rm,
          volume: setVolume(set.weight, set.reps),
        });
      }
    }
  }
  return out;
}

export function bestE1rm(sessions: SessionLog[], exerciseId: string, excludeSessionId?: string) {
  let best = 0;
  for (const set of allWorkingSets(sessions)) {
    if (excludeSessionId && set.sessionId === excludeSessionId) continue;
    if (!sameMovement(set.exerciseId, exerciseId)) continue;
    if (set.e1rm > best) best = set.e1rm;
  }
  return best;
}

export function sessionBestE1rm(session: SessionLog, exerciseId: string) {
  let best = 0;
  const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
  if (!ex) return 0;
  for (const set of ex.sets) best = Math.max(best, epley(set.weight, set.reps));
  return best;
}

export function exerciseVolume(session: SessionLog, exerciseId: string) {
  const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
  if (!ex) return 0;
  return ex.sets.reduce((a, s) => a + setVolume(s.weight, s.reps), 0);
}

export function sessionVolume(session: SessionLog) {
  return session.exercises.reduce((a, ex) => a + ex.sets.reduce((b, s) => b + setVolume(s.weight, s.reps), 0), 0);
}

export type Overload = "up" | "down" | "same" | "empty" | "first";

export function overloadOf(sessions: SessionLog[], session: SessionLog, exerciseId: string): Overload {
  const current = sessionBestE1rm(session, exerciseId);
  if (current <= 0) return "empty";
  const prevSessions = sessions.filter((s) => s.id !== session.id && s.date <= session.date);
  const prev = bestE1rm(prevSessions, exerciseId);
  if (prev <= 0) return "first";
  if (current > prev + 0.25) return "up";
  if (current < prev - 0.25) return "down";
  return "same";
}

export interface PrRow {
  name: string;
  muscle: MuscleKey;
  e1rm: number;
  weight: number;
  reps: number;
  date: string;
}

export function prTable(sessions: SessionLog[]): PrRow[] {
  const best = new Map<string, SetRef>();
  for (const set of allWorkingSets(sessions)) {
    const name = movementName(set.exerciseId);
    const cur = best.get(name);
    if (!cur || set.e1rm > cur.e1rm) best.set(name, set);
  }
  return [...best.entries()]
    .map(([name, set]) => {
      const def = EXERCISE_BY_ID.get(set.exerciseId);
      return {
        name,
        muscle: def?.muscle ?? "back",
        e1rm: set.e1rm,
        weight: set.weight,
        reps: set.reps,
        date: set.date,
      };
    })
    .sort((a, b) => b.e1rm - a.e1rm);
}

export function recentPrs(sessions: SessionLog[], since: string) {
  const rows = prTable(sessions);
  return rows.filter((r) => r.date >= since);
}

export function muscleVolumeBetween(sessions: SessionLog[], from: string, to: string) {
  const totals = new Map<MuscleKey, number>();
  for (const session of sessions) {
    if (session.date < from || session.date > to || session.kind === "walk") continue;
    for (const ex of session.exercises) {
      const def = EXERCISE_BY_ID.get(ex.exerciseId);
      if (!def) continue;
      const vol = ex.sets.reduce((a, s) => a + setVolume(s.weight, s.reps), 0);
      totals.set(def.muscle, (totals.get(def.muscle) ?? 0) + vol);
    }
  }
  return [...totals.entries()]
    .map(([muscle, volume]) => ({ muscle, volume }))
    .sort((a, b) => b.volume - a.volume);
}

export function e1rmSeries(sessions: SessionLog[], name: string) {
  const points: { date: string; e1rm: number }[] = [];
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  for (const session of sorted) {
    let best = 0;
    for (const ex of session.exercises) {
      if (movementName(ex.exerciseId) !== name) continue;
      for (const set of ex.sets) best = Math.max(best, epley(set.weight, set.reps));
    }
    if (best > 0) points.push({ date: session.date, e1rm: Math.round(best * 10) / 10 });
  }
  return points;
}

export function movementNames() {
  return [...new Set(EXERCISES.map((e) => e.name))];
}

export function suggestedKind(anchor: string, date: string): SessionKind {
  const start = new Date(`${anchor}T12:00:00`);
  const cur = new Date(`${date}T12:00:00`);
  const diff = Math.round((cur.getTime() - start.getTime()) / 86400000);
  const idx = ((diff % 7) + 7) % 7;
  return CYCLE[idx] ?? "rest";
}

export function weekTraining(sessions: SessionLog[], date: string) {
  const start = weekStart(date);
  const end = addDays(start, 6);
  const inWeek = sessions.filter((s) => s.date >= start && s.date <= end);
  const lifts = inWeek.filter((s) => s.kind !== "walk" && (s.completed || sessionVolume(s) > 0));
  const walks = inWeek.filter((s) => s.kind === "walk" && ((s.walkMinutes ?? 0) > 0 || s.completed));
  return { start, end, lifts: lifts.length, walks: walks.length, volume: inWeek.reduce((a, s) => a + sessionVolume(s), 0) };
}

export function orderedMeasurements(list: Measurement[]) {
  const undated = list.filter((m) => !m.date);
  const dated = list.filter((m) => m.date).sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label));
  return [...undated, ...dated];
}

export function latestMeasurement<K extends keyof Measurement>(list: Measurement[], key: K) {
  const rows = orderedMeasurements(list).filter((m) => typeof m[key] === "number");
  return rows.length ? rows[rows.length - 1] : undefined;
}

export function previousMeasurement<K extends keyof Measurement>(list: Measurement[], key: K) {
  const rows = orderedMeasurements(list).filter((m) => typeof m[key] === "number");
  return rows.length > 1 ? rows[rows.length - 2] : undefined;
}

export function sleepScore(log: SleepLog) {
  const hours = sleepHours(log.bed, log.wake);
  let score = 100;
  if (hours < 7) score -= (7 - hours) * 14;
  if (hours > 9.5) score -= (hours - 9.5) * 10;
  const bed = hhmmToMinutes(log.bed);
  const onTime = bed >= 18 * 60 && bed < 23 * 60;
  if (!onTime) score -= 18;
  score -= (5 - log.quality) * 6;
  return { hours, score: Math.max(0, Math.min(100, Math.round(score))), onTime };
}

export function weeklySleep(logs: SleepLog[], end: string) {
  const days = lastNDates(end, 7);
  const rows = days
    .map((date) => {
      const log = logs.find((s) => s.date === date);
      if (!log) return null;
      return { date, ...sleepScore(log) };
    })
    .filter((x): x is { date: string; hours: number; score: number; onTime: boolean } => Boolean(x));
  const avgHours = rows.length ? rows.reduce((a, r) => a + r.hours, 0) / rows.length : null;
  const avgScore = rows.length ? rows.reduce((a, r) => a + r.score, 0) / rows.length : null;
  return { rows, avgHours, avgScore };
}

export interface HeatCell {
  date: string;
  score: number | null;
}

export function heatmap(input: {
  end: string;
  weeks: number;
  groups: GroupLog[];
  doses: DoseLog[];
  water: WaterLog[];
  sessions: SessionLog[];
  sleep: SleepLog[];
}): HeatCell[] {
  const end = input.end > todayISO() ? todayISO() : input.end;
  const start = addDays(weekStart(end), -(input.weeks - 1) * 7);
  const cells: HeatCell[] = [];
  for (let i = 0; i < input.weeks * 7; i += 1) {
    const date = addDays(start, i);
    if (date > end) {
      cells.push({ date, score: null });
      continue;
    }
    const food = dayNutrition(input.groups, date).ratio;
    const med = dayAdherence(input.doses, date).ratio;
    const water = waterTotal(input.water, date) >= TARGETS.waterMl ? 1 : 0;
    const trained = input.sessions.some(
      (s) => s.date === date && (s.completed || sessionVolume(s) > 0 || (s.walkMinutes ?? 0) > 0),
    )
      ? 1
      : 0;
    const touched =
      input.groups.some((g) => g.date === date) ||
      input.doses.some((d) => d.date === date) ||
      input.water.some((w) => w.date === date) ||
      input.sessions.some((s) => s.date === date) ||
      input.sleep.some((s) => s.date === date);
    if (!touched) {
      cells.push({ date, score: null });
      continue;
    }
    let score = 0;
    if (food >= 0.8) score += 1;
    if (med >= 0.8) score += 1;
    if (water) score += 1;
    if (trained) score += 1;
    cells.push({ date, score });
  }
  return cells;
}

export function screenOn(screens: ScreenLog[], date: string) {
  return screens.find((s) => s.date === date)?.minutes;
}

export interface Insight {
  id: string;
  tone: "win" | "insight" | "warn" | "tip";
  title: string;
  body: string;
}

export interface InsightInput {
  groups: GroupLog[];
  doses: DoseLog[];
  water: WaterLog[];
  sessions: SessionLog[];
  sleep: SleepLog[];
  screens: ScreenLog[];
  measurements: Measurement[];
  focusDate: string;
}

export function buildInsights(input: InsightInput, now = new Date()): Insight[] {
  const out: Insight[] = [];
  const latestW = latestMeasurement(input.measurements, "weight");
  const prevW = previousMeasurement(input.measurements, "weight");
  const latestF = latestMeasurement(input.measurements, "pbf");
  const latestM = latestMeasurement(input.measurements, "smm");

  out.push({
    id: "journey",
    tone: "win",
    title: "الدهون نزلت والعضل زاد على مستوى الرحلة",
    body: "من القراءة الأولى إلى InBody الحالي: الدهون 21.6% → 16.6%، والكتلة العضلية 33.8 → 36.2 كجم، والوزن من 76.6 إلى 77.1. التركيب تحسّن حتى مع ثبات الوزن تقريبًا.",
  });

  if (latestW && prevW && latestF && latestM && typeof latestW.weight === "number" && typeof prevW.weight === "number") {
    const dw = latestW.weight - (prevW.weight ?? latestW.weight);
    out.push({
      id: "last-reading",
      tone: "insight",
      title: "بين آخر قراءتين",
      body: `الوزن ${dw > 0 ? "+" : ""}${dw.toFixed(1)} كجم، الدهون الآن ${latestF.pbf}% والعضل ${latestM.smm} كجم. الهدف الطبي خفض 1.4 كجم دهون والوصول إلى 75.7 كجم دون خسارة عضل.`,
    });
  }

  out.push({
    id: "inbody-flags",
    tone: "insight",
    title: `InBody ${INBODY.score} / 100`,
    body: `BMI ${INBODY.bmi}، دهون حشوية ${INBODY.visceral} ضمن 1–9، ونسبة الخصر إلى الورك ${INBODY.whr} ضمن المدى. درجة السمنة ${INBODY.obesityDegree}% أعلى بقليل من 110%. BMR ${INBODY.bmr} سعر.`,
  });

  out.push({
    id: "arms",
    tone: "tip",
    title: "الذراعان فوق المدى والساقان حول الطبيعي",
    body: "العضل القطاعي: الذراعان حوالي 120% (Over) والساقان 97–99% (Normal). لا تعدّل تقسيم Belghamdi قبل 12 أسبوع. التقدم بالحمل فقط.",
  });

  const weekWater = lastNDates(input.focusDate, 7).map((date) => waterTotal(input.water, date));
  const loggedWaterDays = weekWater.filter((n) => n > 0).length;
  const avgWater = weekWater.reduce((a, n) => a + n, 0) / 7;
  if (loggedWaterDays >= 3 && avgWater < 1600) {
    out.push({
      id: "water-low",
      tone: "warn",
      title: "الماء أقل من الهدف خلال 7 أيام",
      body: `المتوسط ${Math.round(avgWater)} مل من أصل 2٬000 مل. الملف يطلب لترين موزعة على 8 مرات.`,
    });
  } else if (loggedWaterDays === 0) {
    out.push({
      id: "water-empty",
      tone: "tip",
      title: "ابدأ سجل الماء",
      body: "الهدف 2 لتر يوميًا. كل تسجيل يبني السلسلة والمتوسط الأسبوعي.",
    });
  } else if (avgWater >= 2000) {
    out.push({
      id: "water-win",
      tone: "win",
      title: "الماء على الهدف هذا الأسبوع",
      body: `متوسط ${Math.round(avgWater)} مل خلال آخر 7 أيام.`,
    });
  }

  const adhere = weeklyAdherence(input.doses, input.focusDate, now);
  if (adhere.ratio != null && adhere.loggedDays >= 2 && adhere.ratio < 0.7) {
    out.push({
      id: "meds-low",
      tone: "warn",
      title: "التزام الدواء والمكملات تحت 70%",
      body: `متوسط الأيام المسجّلة ${Math.round(adhere.ratio * 100)}% على ${adhere.loggedDays} أيام. الجرعات الفائتة تظهر في صفحة الدواء.`,
    });
  } else if (adhere.ratio != null && adhere.ratio >= 0.9) {
    out.push({
      id: "meds-win",
      tone: "win",
      title: "التزام دوائي مرتفع",
      body: `${Math.round(adhere.ratio * 100)}% على الأيام التي سجّلت فيها الجرعات.`,
    });
  }

  const foodDays = lastNDates(input.focusDate, 7).map((date) => dayNutrition(input.groups, date));
  const foodLogged = foodDays.filter((d) => d.doneCount > 0);
  if (foodLogged.length >= 2) {
    const avg = foodLogged.reduce((a, d) => a + d.ratio, 0) / foodLogged.length;
    const avgP = foodLogged.reduce((a, d) => a + d.protein, 0) / foodLogged.length;
    out.push({
      id: "food-week",
      tone: avg >= 0.85 ? "win" : avg < 0.6 ? "warn" : "insight",
      title: avg < 0.6 ? "اكتمال الوجبات منخفض" : "تحليل الغذاء لسبعة أيام",
      body: `متوسط اكتمال الكتل ${Math.round(avg * 100)}% وبروتين تقديري ${avgP.toFixed(0)} جم من 66 جم، على ${foodLogged.length} أيام مسجّلة. السعرات المستهدفة 1٬595.`,
    });
  }

  const training = weekTraining(input.sessions, input.focusDate);
  out.push({
    id: "training-week",
    tone: training.lifts >= 2 ? "insight" : "tip",
    title: "حجم التدريب هذا الأسبوع",
    body: `${training.lifts} جلسات حديد من أصل 4 في الدورة، و${training.walks} مشي من أصل 5. الحجم ${Math.round(training.volume)} كجم·عدة.`,
  });

  const prs = recentPrs(input.sessions, addDays(input.focusDate, -14));
  if (prs.length) {
    const top = prs[0];
    out.push({
      id: "pr",
      tone: "win",
      title: `رقم قياسي في ${top.name}`,
      body: `أفضل تقدير لـ 1RM هو ${top.e1rm.toFixed(1)} كجم من ${top.weight} × ${top.reps} بتاريخ ${top.date}.`,
    });
  }

  const sleep = weeklySleep(input.sleep, input.focusDate);
  if (sleep.avgHours != null && sleep.rows.length >= 3 && sleep.avgHours < 7) {
    out.push({
      id: "sleep-low",
      tone: "warn",
      title: "متوسط النوم تحت 7 ساعات",
      body: `${sleep.avgHours.toFixed(1)} ساعة ومتوسط النتيجة ${Math.round(sleep.avgScore ?? 0)}. القاعدة: قبل 11 مساءً وبعد الأكل بساعتين.`,
    });
  } else if (sleep.avgScore != null) {
    out.push({
      id: "sleep-ok",
      tone: "insight",
      title: "النوم هذا الأسبوع",
      body: `متوسط ${sleep.avgHours?.toFixed(1)} ساعة، نتيجة ${Math.round(sleep.avgScore)} على ${sleep.rows.length} ليالٍ.`,
    });
  }

  const corr = sleepTrainingCorrelation(input.sleep, input.sessions);
  if (corr) {
    out.push({
      id: "sleep-corr",
      tone: corr.high >= corr.low ? "insight" : "warn",
      title: "النوم وحجم التمرين في اليوم التالي",
      body: corr.text,
    });
  } else if (input.sleep.length < 4 || input.sessions.length < 2) {
    out.push({
      id: "sleep-need",
      tone: "tip",
      title: "اربط النوم بالتقدم",
      body: "بعد بضع ليالٍ وجلسات، يقارن التطبيق حجم التمرين التالي للنوم الكافي مقابل النوم القصير.",
    });
  }

  const hotScreen = lastNDates(input.focusDate, 7).filter((date) => (screenOn(input.screens, date) ?? 0) > TARGETS.screenMinutes);
  if (hotScreen.length) {
    out.push({
      id: "screens",
      tone: "warn",
      title: "الشاشات تجاوزت 120 دقيقة",
      body: `${hotScreen.length} يوم في آخر أسبوع تجاوز حد الملف.`,
    });
  }

  const wheyToday = input.doses.some((d) => d.date === input.focusDate && d.doseId === "whey" && d.status === "taken");
  if (wheyToday) {
    out.push({
      id: "whey",
      tone: "insight",
      title: "واي اليوم خارج حساب الـ 66 جم",
      body: `مكيال الواي يُقدَّر بحوالي ${WHEY_ESTIMATE.protein} جم بروتين و${WHEY_ESTIMATE.kcal} سعر، ولا يُخلط بهدف الطعام 1٬595 حتى لا يتشوه رقم الروشتة. الكرياتين بلا سعرات تُحتسب. ببتامين بلا تقدير لأن تركيز المكيال غير مذكور في الملف.`,
    });
  }

  return out;
}

function sleepTrainingCorrelation(sleep: SleepLog[], sessions: SessionLog[]) {
  const high: number[] = [];
  const low: number[] = [];
  for (const log of sleep) {
    const scored = sleepScore(log);
    const next = addDays(log.date, 1);
    const volume = sessions.filter((s) => s.date === next).reduce((a, s) => a + sessionVolume(s), 0);
    if (volume <= 0) continue;
    if (scored.hours >= 7) high.push(volume);
    else low.push(volume);
  }
  if (high.length < 2 || low.length < 2) return null;
  const avg = (xs: number[]) => xs.reduce((a, n) => a + n, 0) / xs.length;
  const h = avg(high);
  const l = avg(low);
  const pct = l === 0 ? 0 : Math.round(((h - l) / l) * 100);
  return {
    high: h,
    low: l,
    text:
      pct >= 0
        ? `بعد نوم 7 ساعات أو أكثر، حجم اليوم التالي أعلى بنحو ${pct}% (${Math.round(h)} مقابل ${Math.round(l)}). العينة ${high.length + low.length} أيام.`
        : `في العينة الحالية الحجم أعلى بعد النوم القصير (${Math.round(l)} مقابل ${Math.round(h)}). العينة صغيرة، لا تغيّر البرنامج بناءً عليها.`,
  };
}

export function monthlySnapshot(input: InsightInput, month: string) {
  const inMonth = (date: string) => date.startsWith(month);
  const foodDays = [...new Set(input.groups.filter((g) => inMonth(g.date) && g.done).map((g) => g.date))];
  const foodRatios = foodDays.map((date) => dayNutrition(input.groups, date).ratio);
  const doseDays = [...new Set(input.doses.filter((d) => inMonth(d.date)).map((d) => d.date))];
  const doseRatios = doseDays.map((date) => dayAdherence(input.doses, date).ratio);
  const waterDays = [...new Set(input.water.filter((w) => inMonth(w.date)).map((w) => w.date))];
  const waterVals = waterDays.map((date) => waterTotal(input.water, date));
  const sessions = input.sessions.filter((s) => inMonth(s.date));
  const sleepRows = input.sleep.filter((s) => inMonth(s.date)).map((s) => sleepScore(s));
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, n) => a + n, 0) / xs.length : null);
  return {
    foodDays: foodDays.length,
    foodRatio: avg(foodRatios),
    doseDays: doseDays.length,
    doseRatio: avg(doseRatios),
    waterDays: waterDays.length,
    waterAvg: avg(waterVals),
    lifts: sessions.filter((s) => s.kind !== "walk").length,
    walks: sessions.filter((s) => s.kind === "walk").length,
    volume: sessions.reduce((a, s) => a + sessionVolume(s), 0),
    sleepNights: sleepRows.length,
    sleepHours: avg(sleepRows.map((s) => s.hours)),
    sleepScore: avg(sleepRows.map((s) => s.score)),
    prs: prTable(sessions),
  };
}

export function dayScore(input: {
  date: string;
  groups: GroupLog[];
  doses: DoseLog[];
  water: WaterLog[];
  sessions: SessionLog[];
  sleep: SleepLog[];
}) {
  const parts = [
    dayNutrition(input.groups, input.date).ratio,
    dayAdherence(input.doses, input.date).ratio,
    Math.min(1, waterTotal(input.water, input.date) / TARGETS.waterMl),
  ];
  const sleep = input.sleep.find((s) => s.date === input.date);
  if (sleep) parts.push(sleepScore(sleep).score / 100);
  const trained = input.sessions.some((s) => s.date === input.date && (s.completed || sessionVolume(s) > 0 || (s.kind === "walk" && (s.walkMinutes ?? 0) > 0)));
  if (trained) parts.push(1);
  if (!parts.length) return 0;
  return parts.reduce((a, n) => a + n, 0) / parts.length;
}

export function exerciseDef(id: string): ExerciseDef | undefined {
  return EXERCISE_BY_ID.get(id);
}
