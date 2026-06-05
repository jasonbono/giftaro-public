export function calcProgress(contributed: number, target: number): number {
  return target ? Math.min(100, Math.round((contributed / target) * 100)) : 0;
}
