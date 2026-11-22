export function progressPercent(completed: number, total: number): number {
  return total === 0 ? 0 : (completed / total) * 100;
}
