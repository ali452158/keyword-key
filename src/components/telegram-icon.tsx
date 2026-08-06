import * as React from "react"

interface TelegramIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

/**
 * Telegram paper-plane logo. Uses currentColor for the circle background
 * and a white plane on top. Designed to look good on brand gradients.
 */
export function TelegramIcon({
  size = 24,
  className,
  ...props
}: TelegramIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Background circle (uses currentColor) */}
      <circle cx="12" cy="12" r="12" fill="currentColor" />
      {/* White paper plane */}
      <path
        fill="#fff"
        d="M5.46 11.93c3.52-1.53 5.87-2.54 7.05-3.02 3.36-1.4 4.06-1.64 4.51-1.65.1 0 .33.02.48.15.12.11.16.25.17.36.02.1.04.33.02.51-.18 2.03-.98 6.95-1.38 9.22-.17.96-.51 1.28-.83 1.31-.71.07-1.25-.47-1.94-.91-1.08-.71-1.69-1.15-2.74-1.84-1.21-.8-.43-1.24.26-1.96.18-.18 3.25-2.98 3.31-3.23.01-.03.01-.15-.06-.21-.07-.06-.17-.04-.25-.02-.1.02-1.79 1.14-5.05 3.35-.48.33-.91.49-1.29.48-.43-.01-1.24-.24-1.85-.44-.75-.24-1.34-.37-1.29-.79.03-.21.32-.43.88-.66z"
      />
    </svg>
  )
}
