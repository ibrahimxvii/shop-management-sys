import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { DashboardContent } from "@/components/layout/dashboard-content";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { KeyboardShortcutsModal } from "@/components/onboarding/keyboard-shortcuts-modal";
import { WelcomeHint } from "@/components/onboarding/welcome-hint";
import { RealtimeListener } from "@/components/dashboard/realtime-listener";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <DashboardContent>
        <Navbar />
        <main id="main-content" className="flex-1" tabIndex={-1}>
          <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </DashboardContent>
      <CommandPalette />
      <KeyboardShortcutsModal />
      <WelcomeHint />
      <RealtimeListener />
    </div>
  );
}
