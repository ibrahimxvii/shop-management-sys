"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
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
import { customerSchema, type CustomerFormValues, type CustomerFormInput } from "@/lib/validations/order";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/use-customers";
import type { Customer } from "@/types/orders";

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
}

export function CustomerFormDialog({ open, onOpenChange, customer }: CustomerFormDialogProps) {
  const isEditing = !!customer;
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormInput, unknown, CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "PK",
      postal_code: "",
      notes: "",
      status: "active",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        full_name: customer?.full_name ?? "",
        email: customer?.email ?? "",
        phone: customer?.phone ?? "",
        address: customer?.address ?? "",
        city: customer?.city ?? "",
        state: customer?.state ?? "",
        country: customer?.country ?? "PK",
        postal_code: customer?.postal_code ?? "",
        notes: customer?.notes ?? "",
        status: customer?.status ?? "active",
      });
    }
  }, [open, customer, reset]);

  const onSubmit = async (values: CustomerFormValues) => {
    if (isEditing && customer) {
      await updateCustomer.mutateAsync({ id: customer.id, values });
    } else {
      await createCustomer.mutateAsync(values);
    }
    onOpenChange(false);
  };

  const isPending = createCustomer.isPending || updateCustomer.isPending || isSubmitting;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Customer" : "New Customer"}
      description={isEditing ? "Update customer information." : "Add a new customer to your store."}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input id="full_name" {...register("full_name")} placeholder="John Doe" />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} placeholder="john@example.com" />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} placeholder="+1 555 000 0000" />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} placeholder="123 Main St" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("city")} placeholder="New York" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="state">State</Label>
            <Input id="state" {...register("state")} placeholder="NY" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input id="postal_code" {...register("postal_code")} placeholder="74200" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="country">Country</Label>
            <Input id="country" {...register("country")} placeholder="PK" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={2} placeholder="Optional notes..." />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : isEditing ? "Update Customer" : "Create Customer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
