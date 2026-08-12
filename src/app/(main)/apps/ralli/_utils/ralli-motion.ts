export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax === inMin) return outMin;
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + t * (outMax - outMin);
}

export const scoreSequence = ['0', '15', '30', '40', 'GAME'] as const;

export type RalliScore = (typeof scoreSequence)[number];

/** 시안 원본: seq[Math.min(seq.length - 1, Math.floor(p * 5.2))] */
export function scoreAt(progress: number): RalliScore {
  const index = Math.floor(clamp(progress, 0, 1) * 5.2);
  return scoreSequence[Math.min(scoreSequence.length - 1, index)];
}

/** 시안 원본: Math.min(2, Math.floor(p * 3.02)) */
export function stepIndexAt(progress: number, stepCount = 3): number {
  const index = Math.floor(clamp(progress, 0, 1) * (stepCount + 0.02));
  return Math.min(stepCount - 1, index);
}
