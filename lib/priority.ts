export const ORDER_PRIORITIES = ["Normal", "High", "Urgent"] as const;
export type OrderPriority = (typeof ORDER_PRIORITIES)[number];

/**
 * Priority is derived, not stored: it's purely a function of how much of the
 * order->delivery window has elapsed. 0-60% elapsed = Normal, 60-90% = High,
 * 90%+ (including overdue) = Urgent.
 */
export function getOrderPriority(
  orderDate: string | Date,
  deliveryDate: string | Date,
  now: Date = new Date(),
): OrderPriority {
  const start = new Date(orderDate).getTime();
  const end = new Date(deliveryDate).getTime();
  const totalDuration = end - start;

  if (totalDuration <= 0) {
    return "Urgent";
  }

  const elapsedFraction = Math.min(Math.max((now.getTime() - start) / totalDuration, 0), 1);

  if (elapsedFraction < 0.6) return "Normal";
  if (elapsedFraction < 0.9) return "High";
  return "Urgent";
}
