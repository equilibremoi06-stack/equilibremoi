export type WeightEntry = {
  date: string;
  weightKg: number;
  waistCm?: number;
};

export type ProgressSummaryInput = {
  startWeight?: number;
  currentWeight?: number;
  targetWeight?: number;
  completedDays?: number;
  totalDays?: number;
};

export type ProgressSummary = {
  completedDays: number;
  totalDays: number;
  completionRate: number;
  weightLost: number;
  remainingWeight: number;
  startWeight: number;
  currentWeight: number;
  deltaKg: number;
  message: string;
};

function buildSummaryFromInput(data: ProgressSummaryInput = {}): ProgressSummary {
  const completedDays = data.completedDays ?? 0;
  const totalDays = data.totalDays ?? 21;
  const startWeight = data.startWeight ?? 0;
  const currentWeight = data.currentWeight ?? startWeight;
  const targetWeight = data.targetWeight ?? currentWeight;
  const deltaKg = currentWeight - startWeight;
  const weightLost = Math.max(0, startWeight - currentWeight);
  const remainingWeight = Math.max(0, currentWeight - targetWeight);
  const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  return {
    completedDays,
    totalDays,
    completionRate,
    weightLost,
    remainingWeight,
    startWeight,
    currentWeight,
    deltaKg,
    message: `Tu as complété ${completedDays} jour(s) sur ${totalDays}.`,
  };
}

export function buildProgressSummary(data?: ProgressSummaryInput | WeightEntry[]): ProgressSummary {
  if (Array.isArray(data)) {
    const sortedEntries = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const first = sortedEntries[0];
    const last = sortedEntries[sortedEntries.length - 1];
    return buildSummaryFromInput({
      startWeight: first?.weightKg ?? 0,
      currentWeight: last?.weightKg ?? first?.weightKg ?? 0,
      completedDays: sortedEntries.length,
      totalDays: Math.max(21, sortedEntries.length),
    });
  }

  return buildSummaryFromInput(data);
}