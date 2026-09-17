"use client";

/**
 * Dashboard redirector — routes users to their role-appropriate dashboard.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    switch (user.role) {
      case "ADMIN":
        router.replace("/dashboard/admin");
        break;
      case "TRAINER":
        router.replace("/dashboard/trainer");
        break;
      case "CUSTOMER":
        router.replace("/customer/pass");
        break;
      default:
        router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
    </div>
  );
}
