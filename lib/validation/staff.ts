import { z } from "zod";
import { STAFF_ROLES } from "../constants";

export const staffCreateSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(STAFF_ROLES),
});

export type StaffCreateInput = z.infer<typeof staffCreateSchema>;
