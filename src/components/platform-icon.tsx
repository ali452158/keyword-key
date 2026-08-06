import type { Platform } from "@/lib/types"
import { cn } from "@/lib/utils"

interface PlatformIconProps {
  platform: Platform
  className?: string
}

export function PlatformIcon({ platform, className }: PlatformIconProps) {
  const iconClass = cn("w-5 h-5", className)

  switch (platform) {
    case "tiktok":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={iconClass}
          aria-hidden="true"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
        </svg>
      )
    case "youtube":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={iconClass}
          aria-hidden="true"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    case "instagram":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={iconClass}
          aria-hidden="true"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
      )
    case "facebook":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={iconClass}
          aria-hidden="true"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    default:
      return null
  }
}

interface PlatformBadgeProps {
  platform: Platform
  size?: "sm" | "md" | "lg"
  className?: string
  showName?: boolean
}

const PLATFORM_GRADIENTS: Record<Platform, string> = {
  tiktok: "bg-gradient-to-br from-[#25F4EE] via-[#000000] to-[#FE2C55]",
  youtube: "bg-gradient-to-br from-[#FF0000] to-[#CC0000]",
  instagram:
    "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
  facebook: "bg-gradient-to-br from-[#1877F2] to-[#0A5BC4]",
}

const sizeMap = {
  sm: { box: "w-8 h-8", icon: "w-4 h-4", text: "text-xs" },
  md: { box: "w-10 h-10", icon: "w-5 h-5", text: "text-sm" },
  lg: { box: "w-14 h-14", icon: "w-7 h-7", text: "text-base" },
}

export function PlatformBadge({
  platform,
  size = "md",
  className,
  showName = false,
}: PlatformBadgeProps) {
  const s = sizeMap[size]
  const names: Record<Platform, string> = {
    tiktok: "تيك توك",
    youtube: "يوتيوب",
    instagram: "انستجرام",
    facebook: "فيسبوك",
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-xl flex items-center justify-center text-white shadow-md shrink-0",
          s.box,
          PLATFORM_GRADIENTS[platform]
        )}
      >
        <PlatformIcon platform={platform} className={s.icon} />
      </div>
      {showName && (
        <span className={cn("font-semibold", s.text)}>{names[platform]}</span>
      )}
    </div>
  )
}
