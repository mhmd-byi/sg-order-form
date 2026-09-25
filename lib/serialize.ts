import type { ItemType, Metal, OrderStatus, LabourType, SizeUnit, RateStatus, City, ArtisanStage } from "./constants";
import type { OrderView } from "./types";

interface OrderDocLike {
  orderNumber: number;
  customer: { name: string; phone: string; address: string };
  items: Array<{
    itemType: ItemType;
    metal: Metal;
    purity: string;
    weightGrams: number;
    size?: string | null;
    sizeUnit?: SizeUnit | null;
    designDetails?: string | null;
    photoUrl?: string | null;
    videoUrl?: string | null;
    voiceNoteUrl?: string | null;
    labourType?: LabourType | null;
    labourValue?: number | null;
  }>;
  status?: OrderStatus | null;
  createdAt: Date | string;
  deliveryDate: Date | string;
  labDetails?: string | null;
  rateStatus?: RateStatus | null;
  rateValue?: number | null;
  ratePurity?: string | null;
  city: City;
  advancePayment?: {
    cashAmount?: number | null;
    upiAmount?: number | null;
    goldGrams?: number | null;
    date?: Date | string | null;
  } | null;
  assignedArtisan?: { toString(): string } | null;
  artisanStage?: ArtisanStage | null;
  signatureUrl?: string | null;
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
      size: item.size ?? "",
      sizeUnit: item.sizeUnit ?? undefined,
      designDetails: item.designDetails ?? "",
      photoUrl: item.photoUrl ?? undefined,
      videoUrl: item.videoUrl ?? undefined,
      voiceNoteUrl: item.voiceNoteUrl ?? undefined,
      labourType: item.labourType ?? undefined,
      labourValue: item.labourValue ?? undefined,
    })),
    status: doc.status ?? "Pending",
    createdAt: new Date(doc.createdAt).toISOString(),
    deliveryDate: new Date(doc.deliveryDate).toISOString(),
    labDetails: doc.labDetails ?? "",
    rateStatus: doc.rateStatus ?? "Unfixed",
    rateValue: doc.rateValue ?? 0,
    ratePurity: doc.ratePurity ?? "",
    city: doc.city,
    advancePayment:
      doc.advancePayment?.date != null &&
      (doc.advancePayment?.cashAmount != null || doc.advancePayment?.upiAmount != null || doc.advancePayment?.goldGrams != null)
        ? {
            cashAmount: doc.advancePayment.cashAmount ?? undefined,
            upiAmount: doc.advancePayment.upiAmount ?? undefined,
            goldGrams: doc.advancePayment.goldGrams ?? undefined,
            date: new Date(doc.advancePayment.date).toISOString(),
          }
        : undefined,
    assignedArtisan: doc.assignedArtisan ? doc.assignedArtisan.toString() : undefined,
    artisanStage: doc.artisanStage ?? undefined,
    signatureUrl: doc.signatureUrl ?? undefined,
  };
}
