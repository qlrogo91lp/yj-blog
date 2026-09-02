import { clamp } from '../../_utils/landing-motion';

export const scoreSequence = ['0', '15', '30', '40', 'GAME'] as const;

export type RalliScore = (typeof scoreSequence)[number];

/** 시안 원본: seq[Math.min(seq.length - 1, Math.floor(p * 5.2))] */
export function scoreAt(progress: number): RalliScore {
  const index = Math.floor(clamp(progress, 0, 1) * 5.2);
  return scoreSequence[Math.min(scoreSequence.length - 1, index)];
}
