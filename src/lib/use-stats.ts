import { useState, useEffect, useCallback } from "react";

const LOCAL_KEY_USER = "image_studio_user_generated";
const LOCAL_KEY_TOTAL = "image_studio_total_generated";

export function recordGeneratedImage(serverTotal?: number) {
  if (typeof window === "undefined") return;

  // Update user's local count
  const currentLocal = parseInt(localStorage.getItem(LOCAL_KEY_USER) || "0", 10) + 1;
  localStorage.setItem(LOCAL_KEY_USER, currentLocal.toString());

  // Update total count
  let newTotal = serverTotal;
  if (!newTotal) {
    const cachedTotal = parseInt(localStorage.getItem(LOCAL_KEY_TOTAL) || "0", 10);
    newTotal = Math.max(cachedTotal + 1, currentLocal);
  }
  localStorage.setItem(LOCAL_KEY_TOTAL, newTotal.toString());

  // Dispatch custom event for all components on this page
  window.dispatchEvent(
    new CustomEvent("image_studio_generated_event", {
      detail: { userCount: currentLocal, totalCount: newTotal },
    })
  );
}

export function useStats() {
  const [totalCount, setTotalCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_KEY_TOTAL);
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });

  const [userCount, setUserCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_KEY_USER);
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync with server /api/stats
  const syncWithServer = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        if (typeof data.totalGenerated === "number") {
          setTotalCount((prev) => {
            const next = Math.max(prev, data.totalGenerated);
            if (typeof window !== "undefined") {
              localStorage.setItem(LOCAL_KEY_TOTAL, next.toString());
            }
            return next;
          });
        }
      }
    } catch {
      // Offline or network error - use cached values
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncWithServer();

    // Listen to local generate events
    const handleLocalEvent = (e: Event) => {
      const custom = e as CustomEvent<{ userCount: number; totalCount: number }>;
      if (custom.detail) {
        setUserCount(custom.detail.userCount);
        setTotalCount((prev) => Math.max(prev, custom.detail.totalCount));
      }
    };

    window.addEventListener("image_studio_generated_event", handleLocalEvent);
    return () => {
      window.removeEventListener("image_studio_generated_event", handleLocalEvent);
    };
  }, [syncWithServer]);

  return { totalCount, userCount, isLoading, refresh: syncWithServer };
}
