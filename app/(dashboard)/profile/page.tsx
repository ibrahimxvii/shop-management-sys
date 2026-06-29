import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileService } from "@/services/profile.service";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await profileService.getProfile(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb items={[{ label: "Profile" }]} />
        <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-base font-semibold">Account Details</h2>
          <ProfileForm profile={profile} />
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-base font-semibold">Change Password</h2>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
