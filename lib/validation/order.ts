import { z } from "zod";
import { ITEM_TYPES, METALS, ORDER_STATUSES } from "../constants";

export const orderItemSchema = z.object({
  itemType: z.enum(ITEM_TYPES),
  metal: z.enum(METALS),
  purity: z.string().min(1, "Purity is required"),
  weightGrams: z.coerce.number().positive("Weight must be greater than 0"),
  designDetails: z.string().optional().default(""),
  photoUrl: z.url().optional(),
});

export const orderCreateSchema = z.object({
  customer: z.object({
    name: z.string().min(1, "Customer name is required"),
    phone: z.string().min(1, "Phone number is required"),
    address: z.string().min(1, "Address is required"),
  }),
  items: z.array(orderItemSchema).min(1, "Add at least one item"),
  deliveryDate: z.coerce.date("Delivery date is required"),
  labDetails: z.string().optional().default(""),
  advancePayment: z
    .object({
      amount: z.coerce.number().positive("Advance amount must be greater than 0"),
      date: z.coerce.date(),
    })
    .optional(),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});
