"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/modal";
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
import { supplierSchema, type SupplierFormValues, type SupplierFormInput } from "@/lib/validations/supplier";
import { useCreateSupplier, useUpdateSupplier } from "@/hooks/use-suppliers";
import type { Supplier } from "@/types/suppliers";

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
}

export function SupplierFormDialog({ open, onOpenChange, supplier }: SupplierFormDialogProps) {
  const isEditing = !!supplier;
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const form = useForm<SupplierFormInput, unknown, SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      contact_name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "PK",
      notes: "",
      status: "active",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: supplier?.name ?? "",
        contact_name: supplier?.contact_name ?? "",
        email: supplier?.email ?? "",
        phone: supplier?.phone ?? "",
        address: supplier?.address ?? "",
        city: supplier?.city ?? "",
        country: supplier?.country ?? "PK",
        notes: supplier?.notes ?? "",
        status: supplier?.status ?? "active",
      });
    }
  }, [open, supplier, form]);

  const isPending = createSupplier.isPending || updateSupplier.isPending;

  const handleSubmit = form.handleSubmit(async (values) => {
    if (isEditing && supplier) {
      const result = await updateSupplier.mutateAsync({ id: supplier.id, values });
      if (result) onOpenChange(false);
    } else {
      const result = await createSupplier.mutateAsync(values);
      if (result) onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the supplier details below." : "Add a new supplier to order stock from."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sup-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input id="sup-name" placeholder="e.g. Karachi Textiles Co." {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-contact">Contact Person</Label>
              <Input id="sup-contact" placeholder="e.g. Ahmed Khan" {...form.register("contact_name")} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sup-email">Email</Label>
              <Input id="sup-email" type="email" placeholder="supplier@example.com" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-phone">Phone</Label>
              <Input id="sup-phone" placeholder="+92 300 1234567" {...form.register("phone")} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sup-address">Address</Label>
              <Input id="sup-address" placeholder="Street address" {...form.register("address")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-city">City</Label>
              <Input id="sup-city" placeholder="e.g. Lahore" {...form.register("city")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sup-notes">Notes</Label>
            <Textarea id="sup-notes" rows={2} placeholder="Any notes about this supplier…" {...form.register("notes")} />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(v) => form.setValue("status", v as "active" | "inactive", { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending} loadingText={isEditing ? "Saving…" : "Creating…"}>
              {isEditing ? "Save changes" : "Create supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
