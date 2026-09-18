import type { ItemType, Metal, OrderStatus } from "./constants";

export interface OrderItemView {
  itemType: ItemType;
  metal: Metal;
  purity: string;
  weightGrams: number;
  designDetails: string;
  photoUrl?: string;
}

export interface AdvancePaymentView {
  amount: number;
  date: string;
}

export interface OrderView {
  orderNumber: number;
  customer: { name: string; phone: string; address: string };
  items: OrderItemView[];
  status: OrderStatus;
  createdAt: string;
  deliveryDate: string;
  labDetails: string;
  advancePayment?: AdvancePaymentView;
  assignedArtisan?: string;
}
