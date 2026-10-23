import type { SessionKind } from "@/lib/clinical";

export type DoseStatus = "taken" | "missed";

export interface DoseLog {
  date: string;
  doseId: string;
  status: DoseStatus;
  at?: string;
}

export interface GroupLog {
  date: string;
  groupId: string;
  choice: string;
  done: boolean;
}

export interface WaterLog {
  id: string;
  date: string;
  ml: number;
  at: string;
}

export interface SleepLog {
  date: string;
  bed: string;
  wake: string;
  quality: number;
}

export interface ScreenLog {
  date: string;
  minutes: number;
}

export interface NoteLog {
  date: string;
  text: string;
}

export interface SetEntry {
  id: string;
  weight: number;
  reps: number;
  rir: number | null;
  rpe: number | null;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetEntry[];
  note: string;
}

export interface SessionLog {
  id: string;
  date: string;
  kind: Exclude<SessionKind, "rest">;
  exercises: ExerciseLog[];
  walkMinutes: number | null;
  note: string;
  completed: boolean;
}

export interface Measurement {
  id: string;
  date: string;
  label: string;
  weight?: number;
  waist?: number;
  chest?: number;
  arm?: number;
  thigh?: number;
  pbf?: number;
  smm?: number;
  source: "inbody" | "manual";
}

export interface PhotoMeta {
  id: string;
  date: string;
  view: "front" | "side" | "back";
  note: string;
}

export interface PersistedShape {
  anchorDate: string;
  doses: DoseLog[];
  groups: GroupLog[];
  water: WaterLog[];
  sleep: SleepLog[];
  screens: ScreenLog[];
  notes: NoteLog[];
  sessions: SessionLog[];
  measurements: Measurement[];
  photos: PhotoMeta[];
}
