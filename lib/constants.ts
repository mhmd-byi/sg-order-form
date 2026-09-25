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
  Gold: ["24K", "23K", "22K", "21K", "20K", "18K", "14K"],
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

export const STAFF_ROLES = ["admin", "staff", "artisan"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const LABOUR_TYPES = ["Percentage", "Fixed"] as const;
export type LabourType = (typeof LABOUR_TYPES)[number];

export const RATE_STATUSES = ["Fixed", "Unfixed"] as const;
export type RateStatus = (typeof RATE_STATUSES)[number];

export const SIZE_UNITS = ["Number", "Inches", "Aana"] as const;
export type SizeUnit = (typeof SIZE_UNITS)[number];

export const CITIES = ["Indore", "Ratlam"] as const;
export type City = (typeof CITIES)[number];

// An artisan's sub-workflow while an order is InProgress. Entered
// automatically at "Accepted" the moment an order is picked/assigned to
// them — reaching "Dispatched" is what moves the order's top-level status
// from InProgress to Ready.
export const ARTISAN_STAGES = ["Accepted", "Started", "Completed", "Dispatched"] as const;
export type ArtisanStage = (typeof ARTISAN_STAGES)[number];

export const ARTISAN_STAGE_LABELS: Record<ArtisanStage, string> = {
  Accepted: "Accepted",
  Started: "Started",
  Completed: "Completed",
  Dispatched: "Dispatched",
};

export const NEXT_ARTISAN_STAGE: Record<ArtisanStage, ArtisanStage | null> = {
  Accepted: "Started",
  Started: "Completed",
  Completed: "Dispatched",
  Dispatched: null,
};
