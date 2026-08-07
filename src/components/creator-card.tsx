import * as React from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { TelegramIcon } from "@/components/telegram-icon"
import { TikTokIcon } from "@/components/tiktok-icon"
import { InstagramIcon } from "@/components/instagram-icon"
import { User, AtSign, ArrowUpLeft } from "lucide-react"

/**
 * Creator profile card — shows the site owner's photo, name, Telegram
 * account handle, and a prominent CTA to their Telegram channel.
 *
 * Used in the footer as a "meet the creator" strip.
 */
export function CreatorCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-brand-soft dark:bg-card/60 p-5 sm:p-6">
      <div className="absolute -top-16 -left-10 w-48 h-48 bg-primary/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-16 -right-10 w-48 h-48 bg-accent/15 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-full bg-gradient-brand blur-md opacity-60 animate-pulse-glow" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-4 ring-background shadow-brand-lg">
            <Image
              src="/ali-tredr.jpg"
              alt="ali tredr — صانع المحتوى ومؤسس Keyword Key"
              fill
              sizes="(max-width: 640px) 96px, 112px"
              className="object-cover"
              priority
            />
          </div>
          {/* small telegram badge on avatar */}
          <div className="absolute -bottom-1 -left-1 w-9 h-9 rounded-full bg-[#229ED9] flex items-center justify-center text-white ring-4 ring-background shadow-md">
            <TelegramIcon size={18} className="text-white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-right min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
            <Badge className="bg-gradient-brand text-white border-transparent">
              <User className="w-3 h-3 ml-1" />
              صانع المحتوى
            </Badge>
          </div>
          <h3 className="font-display font-extrabold text-xl sm:text-2xl text-gradient-brand mb-1">
            ali tredr
          </h3>
          <p className="text-sm text-muted-foreground mb-4 flex items-center justify-center sm:justify-start gap-1.5">
            <AtSign className="w-3.5 h-3.5" />
            مؤسس منصة Keyword Key ومحلل ترندات السوشيال ميديا
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
            {/* Telegram channel — primary */}
            <a
              href="https://t.me/FX_pulssGold"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand text-white font-bold text-sm px-4 py-2.5 shadow-brand hover:shadow-brand-lg hover:-translate-y-0.5 transition-all"
            >
              <TelegramIcon size={18} className="text-white" />
              انضم لقناة تلجرام
              <ArrowUpLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            {/* Telegram account — secondary */}
            <a
              href="https://t.me/ali_0165"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-secondary text-foreground font-semibold text-sm px-4 py-2.5 border border-border hover:bg-accent hover:text-primary transition-colors"
            >
              <AtSign className="w-3.5 h-3.5" />
              ali_0165
            </a>

            {/* TikTok account — secondary */}
            <a
              href="https://www.tiktok.com/@ali.trad011"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-xl text-white font-semibold text-sm px-4 py-2.5 bg-gradient-to-br from-[#25F4EE] via-[#000000] to-[#FE2C55] hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              <TikTokIcon size={16} className="text-white" />
              ali.trad011
            </a>

            {/* Instagram account — secondary */}
            <a
              href="https://www.instagram.com/alitredr0"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-xl text-white font-semibold text-sm px-4 py-2.5 bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              <InstagramIcon size={16} className="text-white" />
              alitredr0
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
