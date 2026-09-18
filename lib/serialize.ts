import type { ItemType, Metal, OrderStatus } from "./constants";
import type { OrderView } from "./types";

interface OrderDocLike {
  orderNumber: number;
  customer: { name: string; phone: string; address: string };
  items: Array<{
    itemType: ItemType;
    metal: Metal;
    purity: string;
    weightGrams: number;
    designDetails?: string | null;
    photoUrl?: string | null;
  }>;
  status?: OrderStatus | null;
  createdAt: Date | string;
  deliveryDate: Date | string;
  labDetails?: string | null;
  advancePayment?: { amount?: number | null; date?: Date | string | null } | null;
}

export function toOrderView(doc: OrderDocLike): OrderView {
  return {
    orderNumber: doc.orderNumber,
    customer: {
      name: doc.customer.name,
      phone: doc.customer.phone,
      address: doc.customer.address,
    },
    items: doc.items.map((item) => ({
      itemType: item.itemType,
      metal: item.metal,
      purity: item.purity,
      weightGrams: item.weightGrams,
      designDetails: item.designDetails ?? "",
      photoUrl: item.photoUrl ?? undefined,
    })),
    status: doc.status ?? "Pending",
    createdAt: new Date(doc.createdAt).toISOString(),
    deliveryDate: new Date(doc.deliveryDate).toISOString(),
    labDetails: doc.labDetails ?? "",
    advancePayment:
      doc.advancePayment?.amount != null && doc.advancePayment?.date != null
        ? { amount: doc.advancePayment.amount, date: new Date(doc.advancePayment.date).toISOString() }
        : undefined,
  };
}
