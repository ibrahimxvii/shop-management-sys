import { z } from "zod";

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  avatar_url: z.string().optional(),
  avatar_path: z.string().optional(),
});

export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(6, "Current password required"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
    confirm_password: z.string().min(8, "Please confirm your password"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
