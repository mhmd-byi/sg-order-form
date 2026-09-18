import { Schema, model, models } from "mongoose";

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export const CounterModel = models.Counter ?? model("Counter", counterSchema);
