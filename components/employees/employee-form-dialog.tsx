"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SingleImageUploader } from "@/components/ui/single-image-uploader";
import { employeeSchema, type EmployeeFormValues } from "@/lib/validations/employee";
import { useCreateEmployee, useUpdateEmployee } from "@/hooks/use-employees";
import type { Employee } from "@/types/employees";

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
}

export function EmployeeFormDialog({ open, onOpenChange, employee }: EmployeeFormDialogProps) {
  const isEditing = !!employee;
  const create = useCreateEmployee();
  const update = useUpdateEmployee();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      role: "staff",
      status: "active",
      avatar_url: "",
      avatar_path: "",
    },
  });

  const avatarUrl = watch("avatar_url");
  const avatarPath = watch("avatar_path");

  React.useEffect(() => {
    if (open) {
      reset({
        full_name: employee?.full_name ?? "",
        email: employee?.email ?? "",
        phone: employee?.phone ?? "",
        role: employee?.role ?? "staff",
        status: employee?.status ?? "active",
        avatar_url: employee?.avatar_url ?? "",
        avatar_path: employee?.avatar_path ?? "",
      });
    }
  }, [open, employee, reset]);

  const onSubmit = async (values: EmployeeFormValues) => {
    if (isEditing && employee) {
      await update.mutateAsync({ id: employee.id, values });
    } else {
      await create.mutateAsync(values);
    }
    onOpenChange(false);
  };

  const isPending = create.isPending || update.isPending || isSubmitting;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Employee" : "New Employee"}
      description={isEditing ? "Update employee details." : "Add a new employee to your team."}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Avatar</Label>
          <SingleImageUploader
            bucket="employee-avatars"
            folder="avatars"
            value={avatarUrl ? { url: avatarUrl, path: avatarPath ?? "" } : null}
            onChange={(img) => {
              setValue("avatar_url", img?.url ?? "");
              setValue("avatar_path", img?.path ?? "");
            }}
            label="avatar"
            className="max-w-xs"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="emp_full_name">Full Name *</Label>
            <Input id="emp_full_name" {...register("full_name")} placeholder="Jane Smith" />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emp_email">Email *</Label>
            <Input id="emp_email" type="email" {...register("email")} placeholder="jane@company.com" />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emp_phone">Phone</Label>
            <Input id="emp_phone" {...register("phone")} placeholder="+1 555 000 0000" />
          </div>

          <div className="space-y-1.5">
            <Label>Role *</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Status *</Label>
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
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : isEditing ? "Update Employee" : "Create Employee"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
