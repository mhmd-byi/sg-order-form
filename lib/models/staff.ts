import { Schema, model, models, type InferSchemaType } from "mongoose";
import { STAFF_ROLES } from "../constants";

const staffSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: STAFF_ROLES, default: "staff" },
  },
  { timestamps: true },
);

export type StaffDoc = InferSchemaType<typeof staffSchema>;

export const StaffModel = models.Staff ?? model("Staff", staffSchema);
