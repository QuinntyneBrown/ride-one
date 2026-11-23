/**
 * Home's heading (L2-033 AC1): "Morning." before 12:00, "Afternoon." from 12:00 to 16:59 and "Evening." from 17:00.
 * Telo Ride 1 knows no rider's name (ADR 0039), so it greets no one by name.
 */
export function homeGreeting(hour: number): string {
  const part = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  return `${part}.`;
}
