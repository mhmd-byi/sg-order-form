import { CounterModel } from "./models/counter";

export async function getNextOrderNumber(): Promise<number> {
  const counter = await CounterModel.findByIdAndUpdate(
    "order",
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );
  return counter.seq;
}
