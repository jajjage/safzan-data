"use client";

import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface WhatsAppWidgetProps {
  phoneNumber?: string;
  message?: string;
  className?: string;
}

export function WhatsAppWidget({
  phoneNumber = "2347039284523",
  message = "Hello! I need help with Safzan Data Sub.",
  className,
}: WhatsAppWidgetProps) {
  const pathname = usePathname();
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  // Don't show the widget on admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <Link
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed right-6 bottom-24 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95 md:right-8 md:bottom-8 lg:h-16 lg:w-16",
        className
      )}
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="h-7 w-7 md:h-8 md:w-8" />
      <span className="absolute -top-1 -right-1 flex h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex h-4 w-4 rounded-full bg-white/20"></span>
      </span>
    </Link>
  );
}
