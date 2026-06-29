import { z } from "zod";

export const employeeSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  role: z.enum(["admin", "manager", "staff"]),
  status: z.enum(["active", "inactive", "on_leave"]).default("active"),
  avatar_url: z.string().optional(),
  avatar_path: z.string().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
