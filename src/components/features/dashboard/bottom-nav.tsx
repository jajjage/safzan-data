"use client";

import { BecomeResellerModal } from "@/components/features/reseller/BecomeResellerModal";
import { useAuth } from "@/hooks/useAuth";
import { useResellerUpgradeStatus } from "@/hooks/useReseller";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Clock,
  HandCoins,
  Home,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const baseNavItems = [
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "Agent", icon: HandCoins, href: "/dashboard/agent" },
  { label: "Rewards", icon: Trophy, href: "/dashboard/rewards" },
  { label: "Profile", icon: User, href: "/dashboard/profile" },
];

const resellerNavItem = {
  label: "Reseller",
  icon: Briefcase,
  href: "/dashboard/reseller",
};

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showResellerModal, setShowResellerModal] = useState(false);
  const { getStatus, clearPending } = useResellerUpgradeStatus();
  const [hasPendingUpgrade, setHasPendingUpgrade] = useState(false);

  const showBecomeReseller = user?.role === "user";
  const isReseller = user?.role === "reseller";

  const navItems = isReseller
    ? [...baseNavItems.slice(0, 2), resellerNavItem, ...baseNavItems.slice(2)]
    : baseNavItems;

  useEffect(() => {
    if (isReseller) {
      clearPending();
      setHasPendingUpgrade(false);
    } else {
      const status = getStatus();
      setHasPendingUpgrade(status.pending);
    }
  }, [isReseller, getStatus, clearPending]);

  const isResellerPath = pathname.startsWith("/dashboard/reseller");

  return (
    <>
      <div className="bg-card fixed bottom-0 left-0 z-50 w-full border-t md:hidden">
        {/* Become a Reseller Banner - Mobile */}
        {showBecomeReseller &&
          (hasPendingUpgrade ? (
            <div className="flex w-full items-center justify-center gap-2 bg-zinc-100 px-4 py-2 text-sm font-medium dark:bg-zinc-800">
              <Clock className="size-4 text-zinc-500" />
              <span className="text-zinc-600 dark:text-zinc-400">
                Upgrade request pending review
              </span>
            </div>
          ) : (
            <button
              onClick={() => setShowResellerModal(true)}
              className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 text-sm font-medium transition-all hover:from-emerald-100 hover:to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50"
            >
              <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-900 dark:text-emerald-100">
                Become a Reseller — Get 10% OFF
              </span>
            </button>
          ))}

        {/* Bottom Navigation */}
        <div
          className={cn(
            "grid h-16 items-center",
            isReseller ? "grid-cols-5" : "grid-cols-4"
          )}
        >
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard/reseller"
                ? isResellerPath
                : pathname === item.href;

            return (
              <Link
                href={item.href}
                key={item.label}
                className={cn(
                  "flex flex-col items-center gap-1 text-xs font-medium",
                  isActive ? "text-primary" : "text-muted-foreground",
                  item.label === "Reseller" &&
                    "relative after:absolute after:-top-1 after:right-1/4 after:size-1.5 after:rounded-full after:bg-emerald-500"
                )}
              >
                <item.icon className="size-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Become a Reseller Modal */}
      <BecomeResellerModal
        open={showResellerModal}
        onOpenChange={(open) => {
          setShowResellerModal(open);
          if (!open) {
            const status = getStatus();
            setHasPendingUpgrade(status.pending);
          }
        }}
      />
    </>
  );
}
