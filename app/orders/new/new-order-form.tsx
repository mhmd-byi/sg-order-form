"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";
import imageCompression from "browser-image-compression";
import {
  ITEM_TYPES,
  METALS,
  PURITY_SUGGESTIONS,
  LABOUR_TYPES,
  SIZE_UNITS,
  RATE_STATUSES,
  type ItemType,
  type Metal,
  type LabourType,
  type SizeUnit,
  type RateStatus,
} from "@/lib/constants";
import { orderCreateSchema } from "@/lib/validation/order";
import { SignaturePad } from "../_components/signature-pad";

interface ItemFormValue {
  id: string;
  itemType: ItemType;
  metal: Metal;
  purity: string;
  weightGrams: number | "";
  size: string;
  sizeUnit: SizeUnit | "";
  designDetails: string;
  photoUrl?: string;
  videoUrl?: string;
  voiceNoteUrl?: string;
  labourType: LabourType | "None";
  labourValue: number | "";
}

interface OrderFormValues {
  customer: { name: string; phone: string; address: string };
  items: ItemFormValue[];
  deliveryDate: string;
  labDetails: string;
  rateStatus: RateStatus | "";
  rateValue: number | "";
  ratePurity: string;
  advanceCash: number | "";
  advanceUpi: number | "";
  advanceGold: number | "";
  advanceDate: string;
}

function createEmptyItem(): ItemFormValue {
  return {
    id: crypto.randomUUID(),
    itemType: "Ring",
    metal: "Gold",
    purity: "22K",
    weightGrams: "",
    size: "",
    sizeUnit: "",
    designDetails: "",
    photoUrl: undefined,
    videoUrl: undefined,
    voiceNoteUrl: undefined,
    labourType: "None",
    labourValue: "",
  };
}

const MAX_PHOTO_SIZE_BYTES = 1024 * 1024; // 1MB

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-zinc-700 dark:bg-zinc-900";

type MediaField = "photoUrl" | "videoUrl" | "voiceNoteUrl";

export function NewOrderForm() {
  const router = useRouter();
  const [mediaStatus, setMediaStatus] = useState<Record<string, "compressing" | "uploading" | undefined>>({});
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const createOrder = useMutation({
    mutationFn: async (payload: unknown) => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create order");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Order created");
      router.push(`/orders/${data.order.orderNumber}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const form = useForm({
    defaultValues: {
      customer: { name: "", phone: "", address: "" },
      items: [createEmptyItem()],
      deliveryDate: "",
      labDetails: "",
      rateStatus: "Unfixed",
      rateValue: "",
      ratePurity: "22K",
      advanceCash: "",
      advanceUpi: "",
      advanceGold: "",
      advanceDate: "",
    } as OrderFormValues,
    onSubmit: async ({ value }) => {
      const payload = {
        customer: value.customer,
        items: value.items.map((item) => ({
          itemType: item.itemType,
          metal: item.metal,
          purity: item.purity,
          weightGrams: item.weightGrams,
          size: item.size,
          sizeUnit: item.sizeUnit === "" ? undefined : item.sizeUnit,
          designDetails: item.designDetails,
          photoUrl: item.photoUrl,
          videoUrl: item.videoUrl,
          voiceNoteUrl: item.voiceNoteUrl,
          labourType: item.labourType === "None" ? undefined : item.labourType,
          labourValue: item.labourType === "None" ? undefined : item.labourValue,
        })),
        deliveryDate: value.deliveryDate,
        labDetails: value.labDetails,
        rateStatus: value.rateStatus === "" ? undefined : value.rateStatus,
        rateValue: value.rateValue,
        ratePurity: value.ratePurity,
        advancePayment:
          (value.advanceCash !== "" || value.advanceUpi !== "" || value.advanceGold !== "") && value.advanceDate
            ? {
                cashAmount: value.advanceCash === "" ? undefined : value.advanceCash,
                upiAmount: value.advanceUpi === "" ? undefined : value.advanceUpi,
                goldGrams: value.advanceGold === "" ? undefined : value.advanceGold,
                date: value.advanceDate,
              }
            : undefined,
        signatureUrl: signatureDataUrl ?? undefined,
      };
      const parsed = orderCreateSchema.safeParse(payload);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
        return;
      }
      await createOrder.mutateAsync(parsed.data);
    },
  });

  async function handleMediaChange(
    item: ItemFormValue,
    field: MediaField,
    file: File | undefined,
    onChange: (next: ItemFormValue) => void,
  ) {
    if (!file) return;
    const statusKey = `${item.id}:${field}`;

    let fileToUpload = file;
    if (field === "photoUrl" && file.size > MAX_PHOTO_SIZE_BYTES) {
      setMediaStatus((prev) => ({ ...prev, [statusKey]: "compressing" }));
      try {
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: false,
        });
      } catch {
        toast.error("Couldn't compress photo, uploading original");
      }
    }

    setMediaStatus((prev) => ({ ...prev, [statusKey]: "uploading" }));
    try {
      const blob = await upload(`orders/${item.id}-${field}-${fileToUpload.name}`, fileToUpload, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      onChange({ ...item, [field]: blob.url });
    } catch {
      toast.error("Upload failed");
    } finally {
      setMediaStatus((prev) => ({ ...prev, [statusKey]: undefined }));
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-8"
    >
      <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">Customer</h2>
        <div className="space-y-4">
          <form.Field name="customer.name">
            {(field) => (
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  required
                  className={inputClass}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="customer.phone">
            {(field) => (
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  required
                  className={inputClass}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="customer.address">
            {(field) => (
              <div>
                <label className="mb-1 block text-sm font-medium">Address</label>
                <textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  required
                  rows={2}
                  className={inputClass}
                />
              </div>
            )}
          </form.Field>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">Order Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="deliveryDate">
            {(field) => (
              <div>
                <label className="mb-1 block text-sm font-medium">Delivery date</label>
                <input
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  required
                  className={inputClass}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="labDetails">
            {(field) => (
              <div>
                <label className="mb-1 block text-sm font-medium">Lab (hallmarking/assay)</label>
                <input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Optional"
                  className={inputClass}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="rateStatus">
            {(field) => (
              <div>
                <label className="mb-1 block text-sm font-medium">Gold rate (with GST)</label>
                <select
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value as RateStatus)}
                  className={inputClass}
                >
                  {RATE_STATUSES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form.Field>
          <form.Subscribe selector={(state) => state.values.rateStatus}>
            {(rateStatus) =>
              rateStatus !== "" && (
                <>
                  <form.Field name="rateValue">
                    {(field) => (
                      <div>
                        <label className="mb-1 block text-sm font-medium">Rate (₹ per gram)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value === "" ? "" : Number(e.target.value))}
                          onBlur={field.handleBlur}
                          required
                          className={inputClass}
                        />
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="ratePurity">
                    {(field) => (
                      <div>
                        <label className="mb-1 block text-sm font-medium">Rate purity</label>
                        <select
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className={inputClass}
                        >
                          {PURITY_SUGGESTIONS.Gold.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </form.Field>
                </>
              )
            }
          </form.Subscribe>
          <form.Field name="advanceCash">
            {(field) => (
              <div>
                <label className="mb-1 block text-sm font-medium">Advance cash (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value === "" ? "" : Number(e.target.value))}
                  onBlur={field.handleBlur}
                  placeholder="Optional"
                  className={inputClass}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="advanceUpi">
            {(field) => (
              <div>
                <label className="mb-1 block text-sm font-medium">Advance UPI (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value === "" ? "" : Number(e.target.value))}
                  onBlur={field.handleBlur}
                  placeholder="Optional"
                  className={inputClass}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="advanceGold">
            {(field) => (
              <div>
                <label className="mb-1 block text-sm font-medium">Advance gold (grams)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value === "" ? "" : Number(e.target.value))}
                  onBlur={field.handleBlur}
                  placeholder="Optional"
                  className={inputClass}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="advanceDate">
            {(field) => (
              <div>
                <label className="mb-1 block text-sm font-medium">Advance date</label>
                <input
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={inputClass}
                />
              </div>
            )}
          </form.Field>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">Items</h2>
        <form.Field name="items">
          {(itemsField) => (
            <div className="space-y-4">
              {itemsField.state.value.map((item, index) => (
                <div key={item.id} className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-500">Item {index + 1}</span>
                    {itemsField.state.value.length > 1 && (
                      <button
                        type="button"
                        onClick={() => itemsField.removeValue(index)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Item type</label>
                      <select
                        value={item.itemType}
                        onChange={(e) =>
                          itemsField.replaceValue(index, { ...item, itemType: e.target.value as ItemType })
                        }
                        className={inputClass}
                      >
                        {ITEM_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Metal</label>
                      <select
                        value={item.metal}
                        onChange={(e) =>
                          itemsField.replaceValue(index, {
                            ...item,
                            metal: e.target.value as Metal,
                            purity: PURITY_SUGGESTIONS[e.target.value as Metal][0],
                          })
                        }
                        className={inputClass}
                      >
                        {METALS.map((metal) => (
                          <option key={metal} value={metal}>
                            {metal}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Purity</label>
                      <select
                        value={PURITY_SUGGESTIONS[item.metal].includes(item.purity) ? item.purity : "Other"}
                        onChange={(e) =>
                          itemsField.replaceValue(index, {
                            ...item,
                            purity: e.target.value === "Other" ? "" : e.target.value,
                          })
                        }
                        className={inputClass}
                      >
                        {PURITY_SUGGESTIONS[item.metal].map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                      {!PURITY_SUGGESTIONS[item.metal].includes(item.purity) && (
                        <input
                          value={item.purity}
                          onChange={(e) => itemsField.replaceValue(index, { ...item, purity: e.target.value })}
                          placeholder="Enter purity"
                          required
                          className={`${inputClass} mt-2`}
                        />
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Weight (grams)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.weightGrams}
                        onChange={(e) =>
                          itemsField.replaceValue(index, {
                            ...item,
                            weightGrams: e.target.value === "" ? "" : Number(e.target.value),
                          })
                        }
                        required
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Size</label>
                      <div className="flex gap-2">
                        <input
                          value={item.size}
                          onChange={(e) => itemsField.replaceValue(index, { ...item, size: e.target.value })}
                          placeholder="If applicable"
                          className={inputClass}
                        />
                        <select
                          value={item.sizeUnit}
                          onChange={(e) =>
                            itemsField.replaceValue(index, { ...item, sizeUnit: e.target.value as SizeUnit | "" })
                          }
                          className={inputClass}
                        >
                          <option value="">Unit</option>
                          {SIZE_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="mb-1 block text-sm font-medium">Labour</label>
                      <div className="flex gap-2">
                        <select
                          value={item.labourType}
                          onChange={(e) => {
                            const labourType = e.target.value as LabourType | "None";
                            itemsField.replaceValue(index, {
                              ...item,
                              labourType,
                              labourValue: labourType === "None" ? "" : item.labourValue,
                            });
                          }}
                          className={inputClass}
                        >
                          <option value="None">None</option>
                          {LABOUR_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        {item.labourType !== "None" && (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.labourValue}
                            onChange={(e) =>
                              itemsField.replaceValue(index, {
                                ...item,
                                labourValue: e.target.value === "" ? "" : Number(e.target.value),
                              })
                            }
                            placeholder={item.labourType === "Percentage" ? "%" : "₹"}
                            required
                            className={inputClass}
                          />
                        )}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="mb-1 block text-sm font-medium">Design details</label>
                      <textarea
                        value={item.designDetails}
                        onChange={(e) => itemsField.replaceValue(index, { ...item, designDetails: e.target.value })}
                        rows={2}
                        className={inputClass}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="mb-1 block text-sm font-medium">Design reference photo</label>
                      <div className="flex flex-wrap gap-2">
                        <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900">
                          Take photo
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) =>
                              handleMediaChange(item, "photoUrl", e.target.files?.[0], (next) =>
                                itemsField.replaceValue(index, next),
                              )
                            }
                          />
                        </label>
                        <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900">
                          Upload photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleMediaChange(item, "photoUrl", e.target.files?.[0], (next) =>
                                itemsField.replaceValue(index, next),
                              )
                            }
                          />
                        </label>
                      </div>
                      {mediaStatus[`${item.id}:photoUrl`] === "compressing" && (
                        <p className="mt-1 text-xs text-zinc-500">Compressing…</p>
                      )}
                      {mediaStatus[`${item.id}:photoUrl`] === "uploading" && (
                        <p className="mt-1 text-xs text-zinc-500">Uploading…</p>
                      )}
                      {item.photoUrl && !mediaStatus[`${item.id}:photoUrl`] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.photoUrl} alt="" className="mt-2 h-16 w-16 rounded-md object-cover" />
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Design reference video</label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) =>
                          handleMediaChange(item, "videoUrl", e.target.files?.[0], (next) =>
                            itemsField.replaceValue(index, next),
                          )
                        }
                        className="text-sm"
                      />
                      {mediaStatus[`${item.id}:videoUrl`] === "uploading" && (
                        <p className="mt-1 text-xs text-zinc-500">Uploading…</p>
                      )}
                      {item.videoUrl && !mediaStatus[`${item.id}:videoUrl`] && (
                        <p className="mt-1 text-xs text-green-600">Video attached</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Voice note</label>
                      <input
                        type="file"
                        accept="audio/*"
                        capture="user"
                        onChange={(e) =>
                          handleMediaChange(item, "voiceNoteUrl", e.target.files?.[0], (next) =>
                            itemsField.replaceValue(index, next),
                          )
                        }
                        className="text-sm"
                      />
                      {mediaStatus[`${item.id}:voiceNoteUrl`] === "uploading" && (
                        <p className="mt-1 text-xs text-zinc-500">Uploading…</p>
                      )}
                      {item.voiceNoteUrl && !mediaStatus[`${item.id}:voiceNoteUrl`] && (
                        <p className="mt-1 text-xs text-green-600">Voice note attached</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => itemsField.pushValue(createEmptyItem())}
                className="rounded-md border border-dashed border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:border-brand hover:text-brand dark:border-zinc-700"
              >
                + Add another item
              </button>
            </div>
          )}
        </form.Field>
      </section>

      <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500">Customer Signature</h2>
        <SignaturePad onChange={setSignatureDataUrl} />
      </section>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <button
            type="submit"
            disabled={isSubmitting || createOrder.isPending}
            className="rounded-md bg-brand px-6 py-2.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting || createOrder.isPending ? "Creating…" : "Create order"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
