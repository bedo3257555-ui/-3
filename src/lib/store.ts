import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { EXERCISES, INBODY_HISTORY, type SessionKind } from "@/lib/clinical";
import { addDays, todayISO, weekStart } from "@/lib/format";
import { uid } from "@/lib/utils";
import type {
  DoseLog,
  DoseStatus,
  ExerciseLog,
  GroupLog,
  Measurement,
  NoteLog,
  PersistedShape,
  PhotoMeta,
  ScreenLog,
  SessionLog,
  SetEntry,
  SleepLog,
  WaterLog,
} from "@/lib/store-types";

export type {
  DoseLog,
  DoseStatus,
  ExerciseLog,
  GroupLog,
  Measurement,
  NoteLog,
  PhotoMeta,
  ScreenLog,
  SessionLog,
  SetEntry,
  SleepLog,
  WaterLog,
} from "@/lib/store-types";

const memory = new Map<string, string>();
const safeStorage = {
  getItem: (name: string) => {
    if (typeof window === "undefined") return memory.get(name) ?? null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined") {
      memory.set(name, value);
      return;
    }
    localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined") {
      memory.delete(name);
      return;
    }
    localStorage.removeItem(name);
  },
};
function seedMeasurements(): Measurement[] {
  return INBODY_HISTORY.map((row) => ({
    id: row.id,
    date: row.date,
    label: row.date ? "InBody 29.07.2026" : row.label,
    weight: row.weight,
    smm: row.smm,
    pbf: row.pbf,
    source: "inbody" as const,
  }));
}

function blankExercise(exerciseId: string, sets: number): ExerciseLog {
  return {
    exerciseId,
    note: "",
    sets: Array.from({ length: Math.max(1, sets) }, () => ({
      id: uid(),
      weight: 0,
      reps: 0,
      rir: null,
      rpe: null,
    })),
  };
}

export function blankSession(date: string, kind: Exclude<SessionKind, "rest">): SessionLog {
  const exercises =
    kind === "walk"
      ? []
      : EXERCISES.filter((e) => e.session === kind).map((e) => blankExercise(e.id, e.sets));
  return {
    id: uid(),
    date,
    kind,
    exercises,
    walkMinutes: kind === "walk" ? 30 : null,
    note: "",
    completed: false,
  };
}

interface ProtocolState extends PersistedShape {
  focusDate: string;
  setFocusDate: (date: string) => void;
  shiftFocus: (delta: number) => void;
  goToday: () => void;
  setAnchor: (date: string) => void;
  setDose: (date: string, doseId: string, status: DoseStatus | null) => void;
  setGroup: (date: string, groupId: string, patch: { done?: boolean; choice?: string }) => void;
  addWater: (date: string, ml: number) => void;
  removeWater: (id: string) => void;
  setSleep: (log: SleepLog | null) => void;
  setScreen: (date: string, minutes: number | null) => void;
  setNote: (date: string, text: string) => void;
  ensureSession: (date: string, kind: Exclude<SessionKind, "rest">) => string;
  updateSession: (id: string, recipe: (session: SessionLog) => SessionLog) => void;
  deleteSession: (id: string) => void;
  addMeasurement: (row: Measurement) => void;
  deleteMeasurement: (id: string) => void;
  addPhoto: (photo: PhotoMeta) => void;
  deletePhoto: (id: string) => void;
  replaceAll: (data: PersistedShape) => void;
  resetLogs: () => void;
}

const emptyPersisted = (): PersistedShape => ({
  anchorDate: weekStart(todayISO()),
  doses: [],
  groups: [],
  water: [],
  sleep: [],
  screens: [],
  notes: [],
  sessions: [],
  measurements: seedMeasurements(),
  photos: [],
});

export const useProtocol = create<ProtocolState>()(
  persist(
    (set, get) => ({
      ...emptyPersisted(),
      focusDate: todayISO(),
      setFocusDate: (date) => {
        if (date > todayISO()) return;
        set({ focusDate: date });
      },
      shiftFocus: (delta) => {
        const next = addDays(get().focusDate, delta);
        if (next > todayISO()) return;
        set({ focusDate: next });
      },
      goToday: () => set({ focusDate: todayISO() }),
      setAnchor: (date) => set({ anchorDate: date }),
      setDose: (date, doseId, status) =>
        set((s) => {
          const rest = s.doses.filter((d) => !(d.date === date && d.doseId === doseId));
          if (!status) return { doses: rest };
          const row: DoseLog = { date, doseId, status, at: new Date().toISOString() };
          return { doses: [...rest, row] };
        }),
      setGroup: (date, groupId, patch) =>
        set((s) => {
          const cur = s.groups.find((g) => g.date === date && g.groupId === groupId);
          const next: GroupLog = {
            date,
            groupId,
            done: patch.done ?? cur?.done ?? false,
            choice: patch.choice ?? cur?.choice ?? "",
          };
          const rest = s.groups.filter((g) => !(g.date === date && g.groupId === groupId));
          if (!next.done && !next.choice) return { groups: rest };
          return { groups: [...rest, next] };
        }),
      addWater: (date, ml) =>
        set((s) => ({
          water: [...s.water, { id: uid(), date, ml, at: new Date().toISOString() }],
        })),
      removeWater: (id) => set((s) => ({ water: s.water.filter((w) => w.id !== id) })),
      setSleep: (log) =>
        set((s) => ({
          sleep: log ? [...s.sleep.filter((x) => x.date !== log.date), log] : s.sleep,
        })),
      setScreen: (date, minutes) =>
        set((s) => ({
          screens:
            minutes == null
              ? s.screens.filter((x) => x.date !== date)
              : [...s.screens.filter((x) => x.date !== date), { date, minutes }],
        })),
      setNote: (date, text) =>
        set((s) => ({
          notes: text.trim()
            ? [...s.notes.filter((n) => n.date !== date), { date, text }]
            : s.notes.filter((n) => n.date !== date),
        })),
      ensureSession: (date, kind) => {
        const existing = get().sessions.find((s) => s.date === date && s.kind === kind);
        if (existing) return existing.id;
        const session = blankSession(date, kind);
        set((s) => ({ sessions: [...s.sessions, session] }));
        return session.id;
      },
      updateSession: (id, recipe) =>
        set((s) => ({
          sessions: s.sessions.map((session) => (session.id === id ? recipe(session) : session)),
        })),
      deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
      addMeasurement: (row) => set((s) => ({ measurements: [...s.measurements, row] })),
      deleteMeasurement: (id) =>
        set((s) => ({
          measurements: s.measurements.filter((m) => m.id !== id || m.source === "inbody"),
        })),
      addPhoto: (photo) => set((s) => ({ photos: [...s.photos, photo] })),
      deletePhoto: (id) => set((s) => ({ photos: s.photos.filter((p) => p.id !== id) })),
      replaceAll: (data) =>
        set({
          ...data,
          measurements: data.measurements.length ? data.measurements : seedMeasurements(),
        }),
      resetLogs: () => set({ ...emptyPersisted(), focusDate: todayISO() }),
    }),
    {
      name: "shq-protocol-v1",
      skipHydration: true,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        anchorDate: state.anchorDate,
        doses: state.doses,
        groups: state.groups,
        water: state.water,
        sleep: state.sleep,
        screens: state.screens,
        notes: state.notes,
        sessions: state.sessions,
        measurements: state.measurements,
        photos: state.photos,
      }),
    },
  ),
);

export interface BackupFile {
  app: "sharqawi";
  version: 1;
  exportedAt: string;
  data: PersistedShape;
}

export function makeBackup(): BackupFile {
  const s = useProtocol.getState();
  return {
    app: "sharqawi",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      anchorDate: s.anchorDate,
      doses: s.doses,
      groups: s.groups,
      water: s.water,
      sleep: s.sleep,
      screens: s.screens,
      notes: s.notes,
      sessions: s.sessions,
      measurements: s.measurements,
      photos: s.photos,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function readBackup(value: unknown): PersistedShape | null {
  if (!isRecord(value) || value.app !== "sharqawi" || !isRecord(value.data)) return null;
  const data = value.data;
  if (!Array.isArray(data.doses) || !Array.isArray(data.sessions) || !Array.isArray(data.measurements)) {
    return null;
  }
  const base = emptyPersisted();
  return {
    anchorDate: typeof data.anchorDate === "string" ? data.anchorDate : base.anchorDate,
    doses: data.doses as DoseLog[],
    groups: Array.isArray(data.groups) ? (data.groups as GroupLog[]) : [],
    water: Array.isArray(data.water) ? (data.water as WaterLog[]) : [],
    sleep: Array.isArray(data.sleep) ? (data.sleep as SleepLog[]) : [],
    screens: Array.isArray(data.screens) ? (data.screens as ScreenLog[]) : [],
    notes: Array.isArray(data.notes) ? (data.notes as NoteLog[]) : [],
    sessions: data.sessions as SessionLog[],
    measurements: data.measurements as Measurement[],
    photos: Array.isArray(data.photos) ? (data.photos as PhotoMeta[]) : [],
  };
}
