import { z } from "zod";
import {
  ITEM_TYPES,
  METALS,
  ORDER_STATUSES,
  LABOUR_TYPES,
  SIZE_UNITS,
  RATE_STATUSES,
  ARTISAN_STAGES,
  DISPATCH_METHODS,
} from "../constants";

export const orderItemSchema = z
  .object({
    itemType: z.enum(ITEM_TYPES),
    metal: z.enum(METALS),
    purity: z.string().min(1, "Purity is required"),
    weightGrams: z.coerce.number().positive("Weight must be greater than 0"),
    size: z.string().optional().default(""),
    sizeUnit: z.enum(SIZE_UNITS).optional(),
    designDetails: z.string().optional().default(""),
    photoUrls: z.array(z.url()).optional().default([]),
    videoUrl: z.url().optional(),
    voiceNoteUrl: z.url().optional(),
    labourType: z.enum(LABOUR_TYPES).optional(),
    labourValue: z.coerce.number().positive("Labour value must be greater than 0").optional(),
  })
  .refine((data) => (data.labourType == null) === (data.labourValue == null), {
    message: "Labour type and value must be provided together",
    path: ["labourValue"],
  });

const advancePaymentSchema = z
  .object({
    cashAmount: z.coerce.number().positive("Cash amount must be greater than 0").optional(),
    upiAmount: z.coerce.number().positive("UPI amount must be greater than 0").optional(),
    goldGrams: z.coerce.number().positive("Gold weight must be greater than 0").optional(),
    date: z.coerce.date(),
  })
  .refine((data) => data.cashAmount != null || data.upiAmount != null || data.goldGrams != null, {
    message: "Enter a cash amount, UPI amount, or gold weight for the advance",
    path: ["cashAmount"],
  });

export const orderCreateSchema = z
  .object({
    customer: z.object({
      name: z.string().min(1, "Customer name is required"),
      phone: z.string().min(1, "Phone number is required"),
      address: z.string().min(1, "Address is required"),
    }),
    items: z.array(orderItemSchema).min(1, "Add at least one item"),
    deliveryDate: z.coerce.date("Delivery date is required"),
    labDetails: z.string().optional().default(""),
    // Only relevant when the order includes a gold item — see the refine
    // below. Left unset otherwise rather than defaulted, so a silver/platinum
    // only order doesn't carry a meaningless "gold rate".
    rateStatus: z.enum(RATE_STATUSES).optional(),
    rateValue: z.coerce.number().positive("Rate must be greater than 0").optional(),
    ratePurity: z.string().optional(),
    advancePayment: advancePaymentSchema.optional(),
    // A data: URL (inline PNG from the signature pad), not an http(s) URL.
    signatureUrl: z.string().min(1).optional(),
  })
  .refine(
    (data) =>
      !data.items.some((item) => item.metal === "Gold") ||
      (data.rateStatus != null && data.rateValue != null && !!data.ratePurity?.trim()),
    {
      message: "Gold rate is required when the order includes a gold item",
      path: ["rateValue"],
    },
  );

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const orderAssignSchema = z.object({
  assignedArtisan: z.string().min(1, "Select an artisan"),
});

export const orderStageUpdateSchema = z
  .object({
    artisanStage: z.enum(ARTISAN_STAGES),
    dispatchMethod: z.enum(DISPATCH_METHODS).optional(),
    dispatchedByName: z.string().optional(),
  })
  .refine((data) => data.artisanStage !== "Dispatched" || data.dispatchMethod != null, {
    message: "Select how this was dispatched",
    path: ["dispatchMethod"],
  })
  .refine((data) => data.dispatchMethod !== "Pickup" || !!data.dispatchedByName?.trim(), {
    message: "Enter the name of who picked it up",
    path: ["dispatchedByName"],
  });

export const orderCommentCreateSchema = z
  .object({
    text: z.string().trim().optional(),
    voiceNoteUrl: z.string().min(1).optional(),
  })
  .refine((data) => !!data.text?.trim() || !!data.voiceNoteUrl, {
    message: "Enter a comment or attach a voice note",
    path: ["text"],
  });
