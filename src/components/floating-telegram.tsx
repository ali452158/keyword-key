"use client"

import * as React from "react"
import { TelegramIcon } from "@/components/telegram-icon"

/**
 * Floating Telegram action button — fixed to the bottom-left corner (RTL
 * friendly), with a soft pulse ring and a tooltip on hover. Links to the
 * creator's Telegram channel.
 */
export function FloatingTelegram() {
  return (
    <a
      href="https://t.me/FX_pulssGold"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="انضم لقناة تلجرام"
      className="group fixed bottom-5 left-5 z-50 flex items-center"
    >
      {/* Pulse ring */}
      <span className="absolute inline-flex h-full w-full rounded-full bg-[#229ED9] opacity-60 animate-ping [animation-duration:2.5s]" />

      {/* Button */}
      <span className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#229ED9] text-white shadow-lg shadow-[#229ED9]/40 ring-4 ring-background/80 transition-all group-hover:scale-110 group-hover:bg-[#1b8dc4]">
        <TelegramIcon size={28} className="text-white" />
      </span>

      {/* Tooltip */}
      <span className="pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-popover border border-border px-3 py-1.5 text-xs font-semibold text-popover-foreground shadow-md opacity-0 translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
        انضم لقناة تلجرام
      </span>
    </a>
  )
}
