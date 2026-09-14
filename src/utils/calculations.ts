/**
 * Calculate Accepted Quantity
 * Accepted quantity = Produced quantity - Rejected quantity
 */
export function calculateAcceptedQuantity(produced: number, rejected: number): number {
  if (isNaN(produced) || isNaN(rejected)) return 0;
  return Math.max(0, produced - rejected);
}

/**
 * Calculate Rejection Percentage
 * Rejection percentage = (Rejected / Produced) * 100, to one decimal place
 * If produced is 0, returns 0.0.
 */
export function calculateRejectionPercentage(produced: number, rejected: number): number {
  if (isNaN(produced) || isNaN(rejected)) return 0.0;
  if (produced <= 0) return 0.0;
  const percentage = (rejected / produced) * 100;
  return Number(percentage.toFixed(1));
}

/**
 * Calculate Achievement Percentage
 * Achievement percentage = (Accepted / Planned) * 100, to one decimal place
 * If planned is 0, returns 0.0.
 */
export function calculateAchievementPercentage(planned: number, accepted: number): number {
  if (isNaN(planned) || isNaN(accepted)) return 0.0;
  if (planned <= 0) return 0.0; 
  const percentage = (accepted / planned) * 100;
  return Number(percentage.toFixed(1));
}

export function calculateOEE(planned: number, produced: number, rejected: number, downtimeMinutes: number): { oee: number, availability: number, performance: number, quality: number } {
  // 1. Availability = (Total Time - Downtime) / Total Time
  const availability = (60 - downtimeMinutes) / 60;
  
  // 2. Performance = Produced / Planned (Capped at 100% or 1.0)
  const performance = planned > 0 ? Math.min(1.0, produced / planned) : 0;
  
  // 3. Quality = Accepted / Produced
  const accepted = produced - rejected;
  const quality = produced > 0 ? accepted / produced : 0;
  
  // OEE = A * P * Q
  const oee = availability * performance * quality;
  
  return {
    oee: Number((oee * 100).toFixed(1)),
    availability: Number((availability * 100).toFixed(1)),
    performance: Number((performance * 100).toFixed(1)),
    quality: Number((quality * 100).toFixed(1))
  };
}

/**
 * Calculate Running Time
 * Running time = 60 - Downtime minutes
 */
export function calculateRunningTime(downtimeMinutes: number): number {
  if (isNaN(downtimeMinutes)) return 60;
  const safeDowntime = Math.max(0, Math.min(60, downtimeMinutes));
  return 60 - safeDowntime;
}
