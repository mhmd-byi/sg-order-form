import { Schema, model, models, type InferSchemaType } from "mongoose";
import {
  ITEM_TYPES,
  METALS,
  ORDER_STATUSES,
  LABOUR_TYPES,
  SIZE_UNITS,
  RATE_STATUSES,
  CITIES,
  ARTISAN_STAGES,
  DISPATCH_METHODS,
} from "../constants";

const orderItemSchema = new Schema(
  {
    itemType: { type: String, enum: ITEM_TYPES, required: true },
    metal: { type: String, enum: METALS, required: true },
    purity: { type: String, required: true, trim: true },
    weightGrams: { type: Number, required: true, min: 0 },
    size: { type: String, trim: true, default: "" },
    sizeUnit: { type: String, enum: SIZE_UNITS },
    designDetails: { type: String, trim: true, default: "" },
    photoUrl: { type: String },
    videoUrl: { type: String },
    voiceNoteUrl: { type: String },
    labourType: { type: String, enum: LABOUR_TYPES },
    labourValue: { type: Number, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNumber: { type: Number, required: true, unique: true },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "An order needs at least one item.",
      },
    },
    deliveryDate: { type: Date, required: true },
    labDetails: { type: String, trim: true, default: "" },
    rateStatus: { type: String, enum: RATE_STATUSES, required: true, default: "Unfixed" },
    rateValue: { type: Number, min: 0, required: true },
    ratePurity: { type: String, required: true, trim: true },
    city: { type: String, enum: CITIES, required: true },
    signatureUrl: { type: String },
    advancePayment: {
      cashAmount: { type: Number, min: 0 },
      upiAmount: { type: Number, min: 0 },
      goldGrams: { type: Number, min: 0 },
      date: { type: Date },
    },
    status: { type: String, enum: ORDER_STATUSES, default: "Pending" },
    assignedArtisan: { type: Schema.Types.ObjectId, ref: "Staff", default: null },
    artisanStage: { type: String, enum: ARTISAN_STAGES, default: null },
    dispatchMethod: { type: String, enum: DISPATCH_METHODS },
    dispatchedByName: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof orderSchema>;

export const OrderModel = models.Order ?? model("Order", orderSchema);
