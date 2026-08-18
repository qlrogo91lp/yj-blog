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

/** 시안 원본: Math.min(2, Math.floor(p * 3.02)) */
export function stepIndexAt(progress: number, stepCount = 3): number {
  const index = Math.floor(clamp(progress, 0, 1) * (stepCount + 0.02));
  return Math.min(stepCount - 1, index);
}
