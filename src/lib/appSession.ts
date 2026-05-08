import type { GeneratedWeek } from "./menuEngine";

const SESSION_USER_ID_KEY = "equilibremoi_session_user_id";
const CLASSIQUE_SNAPSHOT_KEY = "equilibremoi_classique_snapshot_v1";
const CLASSIQUE_ONBOARDING_KEY = "equilibremoi_classique_onboarding_complete";

export type ClassiqueGoalValidationSnapshot = {
  requestedTargetKg: number;
  requestedTimeframeWeeks: number;
  adjustedTargetKg: number;
  adjustedTimeframeWeeks: number;
  requestedRate: number;
  isAdjusted: boolean;
  message: string;
};

export type ClassiqueSnapshotV1 = {
  v: 1;
  phase: string;
  step: number;
  analysisIndex: number;
  targetKg: string;
  timeline: string;
  diet: string;
  allergies: string;
  dislikes: string;
  budget: string;
  rhythm: string;
  activeWeek: number;
  activeDay: number;
  goalValidationResult: ClassiqueGoalValidationSnapshot | null;
  validationState: Record<string, boolean>;
  replaceCountByDay: Record<string, number>;
  replaceInfo: string;
  activeTab: string;
  selectedEmotion: string | null;
  coursesDays: number;
  programWeeks?: GeneratedWeek[];
};

export function ensureSessionUserId(): string {
  let userId = localStorage.getItem(SESSION_USER_ID_KEY);

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(SESSION_USER_ID_KEY, userId);
  }

  return userId;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadClassiqueSnapshot(): ClassiqueSnapshotV1 | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(CLASSIQUE_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ClassiqueSnapshotV1>;
    if (parsed.v !== 1 || parsed.phase !== "result") return null;
    return parsed as ClassiqueSnapshotV1;
  } catch {
    return null;
  }
}

export function persistClassiqueSnapshot(snapshot: ClassiqueSnapshotV1): boolean {
  if (!canUseStorage()) return false;
  try {
    localStorage.setItem(CLASSIQUE_SNAPSHOT_KEY, JSON.stringify(snapshot));
    setClassiqueOnboardingComplete(true);
    return true;
  } catch {
    return false;
  }
}

export function hasClassiqueOnboardingComplete(): boolean {
  if (!canUseStorage()) return false;
  return localStorage.getItem(CLASSIQUE_ONBOARDING_KEY) === "true";
}

export function setClassiqueOnboardingComplete(value = true): void {
  if (!canUseStorage()) return;
  localStorage.setItem(CLASSIQUE_ONBOARDING_KEY, value ? "true" : "false");
}