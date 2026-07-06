"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";

/** Supabase Presence channel — tracks which staff are currently viewing the dashboard. */
export function useStaffPresence() {
  const profile = useAuthStore((s) => s.profile);
  const [onlineCount, setOnlineCount] = useState(1);

  useEffect(() => {
    if (!profile) return;

    const supabase = createClient();
    const channel = supabase.channel("staff-presence", {
      config: { presence: { key: profile.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length || 1);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            full_name: profile.full_name,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  return { onlineCount };
}
