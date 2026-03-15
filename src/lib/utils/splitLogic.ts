export interface SplitData {
  [participantId: string]: string; // amount as string
}

export interface Participant {
  id: number;
  name: string;
}

/**
 * Normalizes allocations so they sum to totalParsed.
 * If a specific ID is provided (the one being modified), we adjust others to compensate.
 * Strategy: Distribute the difference among other selected participants that haven't been manually adjusted.
 */
export function normalizeAllocations(
  allocations: Record<number, number>,
  selectedIds: Set<number>,
  totalParsed: number,
  changedId?: number,
  manuallyAdjusted?: Set<number>
): Record<number, number> {
  // Clone to avoid mutation issues in tests if passed by reference, though we usually mutate in component
  // But for pure function test, let's return new object
  const newAllocations = { ...allocations };
  const currentSum = Object.values(newAllocations).reduce((a, b) => a + b, 0);
  const diff = totalParsed - currentSum;

  if (Math.abs(diff) < 0.001) return newAllocations; // Close enough

  const selectedList = Array.from(selectedIds);
  if (selectedList.length === 0) return newAllocations;

  // Only adjust participants who haven't been manually adjusted
  const adjustedSet = manuallyAdjusted || new Set<number>();
  
  let others = selectedList.filter(id => {
    // Don't adjust the participant being changed
    if (id === changedId) return false;
    // Don't adjust manually adjusted participants
    if (adjustedSet.has(id)) return false;
    return true;
  });

  // If there are no other participants to adjust, check if we can adjust manually adjusted ones
  if (others.length === 0 && changedId !== undefined) {
    // If the changed participant is manually adjusted, we can't adjust others
    // If the changed participant is not manually adjusted, we can adjust anyone
    if (!adjustedSet.has(changedId)) {
      // The participant being changed is not manually adjusted
      // In this case, we might need to adjust manual participants
      // For simplicity, let's just set the changed participant to the total
      newAllocations[changedId] = totalParsed;
      return newAllocations;
    }
    // If changedId is manually adjusted and all others are also manually adjusted,
    // we can't redistribute, so just return as is
    return newAllocations;
  }

  if (others.length === 0) {
    // Only one participant selected, they get the full amount
    if (changedId !== undefined) {
      newAllocations[changedId] = totalParsed;
    }
    return newAllocations;
  }

  const adjustmentPerPerson = diff / others.length;

  others.forEach(id => {
    let newVal = (newAllocations[id] || 0) + adjustmentPerPerson;
    if (newVal < 0) newVal = 0; // Prevent negative amounts
    newAllocations[id] = roundToFiveCents(newVal);
  });

  return newAllocations;
}

/**
 * Distributes the remainder evenly among selected participants.
 * Only distributes to participants who haven't been manually adjusted.
 */
export function distributeRemainder(
  allocations: Record<number, number>,
  selectedIds: Set<number>,
  totalParsed: number,
  manuallyAdjusted?: Set<number>
): Record<number, number> {
  const newAllocations = { ...allocations };
  const selectedList = Array.from(selectedIds);
  if (selectedList.length === 0) return newAllocations;

  // Only distribute to participants who haven't been manually adjusted
  const adjustedSet = manuallyAdjusted || new Set<number>();
  const unadjustedParticipants = selectedList.filter(id => !adjustedSet.has(id));
  
  if (unadjustedParticipants.length === 0) return newAllocations;

  const currentSum = Object.values(newAllocations).reduce((a, b) => a + b, 0);
  const remainder = totalParsed - currentSum;

  if (remainder <= 0) return newAllocations;

  const share = remainder / unadjustedParticipants.length;
  unadjustedParticipants.forEach(id => {
    newAllocations[id] = roundToFiveCents((newAllocations[id] || 0) + share);
  });
  return newAllocations;
}

/**
 * Handles amount change logic (clamping negative values).
 * Note: Does not normalize here, normalization is separate.
 */
export function handleAmountChange(
  id: number,
  value: number
): number {
  if (isNaN(value) || value < 0) return 0;
  return value;
}

/**
 * Calculates amount from percentage.
 */
export function calculateAmountFromPercentage(
  totalParsed: number,
  percentage: number
): number {
  return (totalParsed * percentage) / 100;
}

/**
 * Rounds a value to the nearest 5-cent increment.
 */
export function roundToFiveCents(value: number): number {
  return Math.round(value * 20) / 20;
}