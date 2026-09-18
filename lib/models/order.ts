import { Schema, model, models, type InferSchemaType } from "mongoose";
import { ITEM_TYPES, METALS, ORDER_STATUSES } from "../constants";

const orderItemSchema = new Schema(
  {
    itemType: { type: String, enum: ITEM_TYPES, required: true },
    metal: { type: String, enum: METALS, required: true },
    purity: { type: String, required: true, trim: true },
    weightGrams: { type: Number, required: true, min: 0 },
    designDetails: { type: String, trim: true, default: "" },
    photoUrl: { type: String },
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
    advancePayment: {
      amount: { type: Number, min: 0 },
      date: { type: Date },
    },
    status: { type: String, enum: ORDER_STATUSES, default: "Pending" },
    assignedArtisan: { type: Schema.Types.ObjectId, ref: "Staff", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof orderSchema>;

export const OrderModel = models.Order ?? model("Order", orderSchema);
