"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";
import {
  purchaseOrderSchema,
  type PurchaseOrderFormValues,
  type PurchaseOrderFormInput,
} from "@/lib/validations/purchase-order";
import { useCreatePurchaseOrder } from "@/hooks/use-purchase-orders";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useInventoryProducts } from "@/hooks/use-inventory";
import { formatCurrency } from "@/lib/utils";

export function PurchaseOrderForm() {
  const router = useRouter();
  const createPO = useCreatePurchaseOrder();
  const { data: suppliers = [] } = useSuppliers({ status: "active" });
  const { data: products = [] } = useInventoryProducts();

  const supplierOptions: ComboboxOption[] = suppliers.map((s) => ({
    value: s.id,
    label: s.name,
    description: s.contact_name ?? s.email ?? undefined,
  }));

  const productOptions: ComboboxOption[] = products.map((p) => ({
    value: p.id,
    label: p.name,
    description: `${p.sku ? `SKU: ${p.sku} · ` : ""}Current stock: ${p.quantity}`,
  }));

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseOrderFormInput, unknown, PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplier_id: "",
      items: [{ product_id: "", product_name: "", quantity: 1, unit_cost: 0 }],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" }) ?? [];
  const watchedSupplierId = useWatch({ control, name: "supplier_id" }) ?? "";

  const total = watchedItems.reduce(
    (sum, item) => sum + (item.unit_cost || 0) * (item.quantity || 0),
    0
  );

  const onSubmit = async (values: PurchaseOrderFormValues) => {
    const result = await createPO.mutateAsync(values);
    if (result?.id) {
      router.push(`/purchase-orders/${result.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-card space-y-4">
            <h2 className="font-semibold text-sm">Supplier</h2>
            <div className="space-y-1.5">
              <Label required>Select Supplier</Label>
              <Combobox
                options={supplierOptions}
                value={watchedSupplierId}
                onChange={(val) => setValue("supplier_id", val, { shouldValidate: true })}
                placeholder="Select supplier..."
                searchPlaceholder="Search suppliers..."
                emptyText="No suppliers found. Add one first."
              />
              {errors.supplier_id && (
                <p className="text-xs text-destructive">{errors.supplier_id.message}</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Items to Order</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ product_id: "", product_name: "", quantity: 1, unit_cost: 0 })
                }
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Product
              </Button>
            </div>

            {errors.items && typeof errors.items === "object" && "message" in errors.items && (
              <p className="text-xs text-destructive">{String(errors.items.message)}</p>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => {
                const watchedItem = watchedItems[index];
                const lineTotal = (watchedItem?.unit_cost || 0) * (watchedItem?.quantity || 0);

                return (
                  <div key={field.id} className="rounded-lg border bg-muted/20 p-3 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Product *</Label>
                      <Combobox
                        options={productOptions}
                        value={watchedItems[index]?.product_id ?? ""}
                        onChange={(val) => {
                          setValue(`items.${index}.product_id`, val);
                          const product = products.find((p) => p.id === val);
                          if (product) {
                            setValue(`items.${index}.unit_cost`, product.purchase_price);
                            setValue(`items.${index}.product_name`, product.name);
                          }
                        }}
                        placeholder="Select product..."
                        searchPlaceholder="Search products..."
                      />
                      {errors.items?.[index]?.product_id && (
                        <p className="text-xs text-destructive">
                          {errors.items[index]?.product_id?.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-end">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Qty *</Label>
                        <Input
                          type="number"
                          min="1"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Unit Cost *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`items.${index}.unit_cost`, { valueAsNumber: true })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1 text-right">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-sm font-semibold">{formatCurrency(lineTotal)}</p>
                        </div>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-card space-y-3">
            <h2 className="font-semibold text-sm">Notes</h2>
            <Textarea {...register("notes")} rows={3} placeholder="Any notes about this order..." />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-card space-y-4">
            <h2 className="font-semibold text-sm">Summary</h2>
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total Cost</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isSubmitting || createPO.isPending} className="w-full">
              <PackagePlus className="mr-2 h-4 w-4" />
              {isSubmitting || createPO.isPending ? "Creating..." : "Create Purchase Order"}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
