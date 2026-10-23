export function todayISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

export function lastNDates(end: string, n: number) {
  return Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)));
}

/** Week starts Saturday. */
export function weekStart(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  const delta = (d.getDay() + 1) % 7;
  d.setDate(d.getDate() - delta);
  return todayISO(d);
}

export function num(n: number, digits = 0) {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export function formatLong(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

export function formatShort(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    day: "numeric",
    month: "short",
  }).format(d);
}

export function formatMonth(isoMonth: string) {
  const d = new Date(`${isoMonth}-01T12:00:00`);
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    month: "long",
    year: "numeric",
  }).format(d);
}

export function minutesNow(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}

export function hhmmToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

export function sleepHours(bed: string, wake: string) {
  let mins = hhmmToMinutes(wake) - hhmmToMinutes(bed);
  if (mins <= 0) mins += 24 * 60;
  return mins / 60;
}

export function formatHours(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h} س`;
  return `${h} س ${m} د`;
}

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
