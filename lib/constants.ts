export const ITEM_TYPES = [
  "Ring",
  "Necklace",
  "Bangle",
  "Earrings",
  "Chain",
  "Bracelet",
  "Pendant",
  "Other",
] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const METALS = ["Gold", "Silver", "Platinum"] as const;
export type Metal = (typeof METALS)[number];

export const PURITY_SUGGESTIONS: Record<Metal, string[]> = {
  Gold: ["24K", "22K", "18K", "14K"],
  Silver: ["999", "925"],
  Platinum: ["950"],
};

export const ORDER_STATUSES = ["Pending", "InProgress", "Ready", "Delivered"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  Pending: "Pending",
  InProgress: "In Progress",
  Ready: "Ready",
  Delivered: "Delivered",
};

export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  Pending: "InProgress",
  InProgress: "Ready",
  Ready: "Delivered",
  Delivered: null,
};

export const STAFF_ROLES = ["admin", "staff"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
