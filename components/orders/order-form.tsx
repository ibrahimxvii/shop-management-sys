"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";
import { orderSchema, type OrderFormValues, type OrderFormInput } from "@/lib/validations/order";
import { useCreateOrder, useUpdateOrder } from "@/hooks/use-orders";
import { useCustomers } from "@/hooks/use-customers";
import { useInventoryProducts } from "@/hooks/use-inventory";
import type { OrderWithRelations } from "@/types/orders";

interface OrderFormProps {
  order?: OrderWithRelations | null;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

export function OrderForm({ order }: OrderFormProps) {
  const router = useRouter();
  const isEditing = !!order;

  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useInventoryProducts();

  const customerOptions: ComboboxOption[] = customers.map((c) => ({
    value: c.id,
    label: c.full_name,
    description: c.email ?? c.phone ?? undefined,
  }));

  const productOptions: ComboboxOption[] = products.map((p) => ({
    value: p.id,
    label: p.name,
    description: `${p.sku ? `SKU: ${p.sku} · ` : ""}Stock: ${p.quantity} · $${p.selling_price.toFixed(2)}`,
  }));

  const defaultItems = order?.items?.map((item) => ({
    product_id: item.product_id,
    product_name: item.product?.name ?? "",
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_percent: item.discount_percent,
  })) ?? [{ product_id: "", product_name: "", quantity: 1, unit_price: 0, discount_percent: 0 }];

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormInput, unknown, OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_id: order?.customer_id ?? "",
      items: defaultItems,
      discount_amount: order?.discount_amount ?? 0,
      tax_amount: order?.tax_amount ?? 0,
      shipping_amount: order?.shipping_amount ?? 0,
      payment_method: order?.payment_method ?? "cash",
      payment_status: order?.payment_status ?? "unpaid",
      status: order?.status ?? "pending",
      notes: order?.notes ?? "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchedItems = useWatch({ control, name: "items" }) ?? [];
  const watchedDiscount = useWatch({ control, name: "discount_amount" }) ?? 0;
  const watchedTax = useWatch({ control, name: "tax_amount" }) ?? 0;
  const watchedShipping = useWatch({ control, name: "shipping_amount" }) ?? 0;
  const watchedCustomerId = useWatch({ control, name: "customer_id" }) ?? "";

  const subtotal = watchedItems.reduce((sum, item) => {
    const lineTotal =
      (item.unit_price || 0) *
      (item.quantity || 0) *
      (1 - (item.discount_percent || 0) / 100);
    return sum + lineTotal;
  }, 0);

  const grandTotal = subtotal - watchedDiscount + watchedTax + watchedShipping;

  const onSubmit = async (values: OrderFormValues) => {
    if (isEditing && order) {
      await updateOrder.mutateAsync({ id: order.id, values });
      router.push(`/orders/${order.id}`);
    } else {
      const result = await createOrder.mutateAsync(values);
      if (result?.id) {
        router.push(`/orders/${result.id}`);
      }
    }
  };

  const isPending =
    createOrder.isPending || updateOrder.isPending || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: customer + items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <div className="rounded-xl border bg-card p-5 shadow-card space-y-4">
            <h2 className="font-semibold text-sm">Customer</h2>
            <div className="space-y-1.5">
              <Label>Select Customer (optional)</Label>
              <Combobox
                options={customerOptions}
                value={watchedCustomerId}
                onChange={(val) => setValue("customer_id", val)}
                placeholder="Walk-in / No customer"
                searchPlaceholder="Search customers..."
                emptyText="No customers found. Add one first."
              />
            </div>
          </div>

          {/* Order Items */}
          <div className="rounded-xl border bg-card p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Order Items</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    product_id: "",
                    product_name: "",
                    quantity: 1,
                    unit_price: 0,
                    discount_percent: 0,
                  })
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
                const lineTotal =
                  (watchedItem?.unit_price || 0) *
                  (watchedItem?.quantity || 0) *
                  (1 - (watchedItem?.discount_percent || 0) / 100);

                return (
                  <div key={field.id} className="rounded-lg border bg-muted/20 p-3 space-y-3">
                    {/* Product picker */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Product *</Label>
                      <Combobox
                        options={productOptions}
                        value={watchedItems[index]?.product_id ?? ""}
                        onChange={(val) => {
                          setValue(`items.${index}.product_id`, val);
                          const product = products.find((p) => p.id === val);
                          if (product) {
                            setValue(`items.${index}.unit_price`, product.selling_price);
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

                    <div className="grid grid-cols-4 gap-2 items-end">
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
                        <Label className="text-xs">Unit Price *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Discount %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          {...register(`items.${index}.discount_percent`, { valueAsNumber: true })}
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

          {/* Notes */}
          <div className="rounded-xl border bg-card p-5 shadow-card space-y-3">
            <h2 className="font-semibold text-sm">Order Notes</h2>
            <Textarea
              {...register("notes")}
              rows={3}
              placeholder="Any notes about this order..."
            />
          </div>
        </div>

        {/* Right column: totals + payment + status */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="rounded-xl border bg-card p-5 shadow-card space-y-4">
            <h2 className="font-semibold text-sm">Order Summary</h2>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Discount Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("discount_amount", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tax Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("tax_amount", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Shipping ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("shipping_amount", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {watchedDiscount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span className="text-destructive">−{formatCurrency(watchedDiscount)}</span>
                </div>
              )}
              {watchedTax > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>+{formatCurrency(watchedTax)}</span>
                </div>
              )}
              {watchedShipping > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>+{formatCurrency(watchedShipping)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Grand Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl border bg-card p-5 shadow-card space-y-4">
            <h2 className="font-semibold text-sm">Payment</h2>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select
                  defaultValue={order?.payment_method ?? "cash"}
                  onValueChange={(val) =>
                    setValue("payment_method", val as OrderFormValues["payment_method"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Payment Status</Label>
                <Select
                  defaultValue={order?.payment_status ?? "unpaid"}
                  onValueChange={(val) =>
                    setValue("payment_status", val as OrderFormValues["payment_status"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isEditing && (
                <div className="space-y-1.5">
                  <Label>Order Status</Label>
                  <Select
                    defaultValue={order?.status ?? "pending"}
                    onValueChange={(val) =>
                      setValue("status", val as OrderFormValues["status"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isPending} className="w-full">
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isPending
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                ? "Update Order"
                : "Create Order"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
