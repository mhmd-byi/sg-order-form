import type {
  ItemType,
  Metal,
  OrderStatus,
  LabourType,
  SizeUnit,
  RateStatus,
  City,
  ArtisanStage,
  DispatchMethod,
} from "./constants";

export interface OrderItemView {
  itemType: ItemType;
  metal: Metal;
  purity: string;
  weightGrams: number;
  size: string;
  sizeUnit?: SizeUnit;
  designDetails: string;
  photoUrl?: string;
  videoUrl?: string;
  voiceNoteUrl?: string;
  labourType?: LabourType;
  labourValue?: number;
}

export interface AdvancePaymentView {
  cashAmount?: number;
  upiAmount?: number;
  goldGrams?: number;
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
  rateStatus: RateStatus;
  rateValue: number;
  ratePurity: string;
  city: City;
  advancePayment?: AdvancePaymentView;
  assignedArtisan?: string;
  artisanStage?: ArtisanStage;
  dispatchMethod?: DispatchMethod;
  dispatchedByName?: string;
  signatureUrl?: string;
}
