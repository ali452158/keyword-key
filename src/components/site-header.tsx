"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Moon, Sun, KeyRound, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NavItem {
  id: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "لوحة التحكم" },
  { id: "research", label: "بحث الكلمات" },
  { id: "trends", label: "الترندات" },
  { id: "competitor", label: "تحليل المنافسين" },
  { id: "generator", label: "مولّد الأفكار" },
  { id: "integration", label: "ربط الحسابات" },
  { id: "growth", label: "أدوات النمو" },
]

interface SiteHeaderProps {
  activeTab: string
  onTabChange: (id: string) => void
}

export function SiteHeader({ activeTab, onTabChange }: SiteHeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const handleNav = (id: string) => {
    onTabChange(id)
    setMobileOpen(false)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleNav("dashboard")
            }}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-brand rounded-xl blur-md opacity-50 animate-pulse-glow" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-brand">
                <KeyRound className="w-5 h-5" />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-lg text-gradient-brand">
                Keyword Key
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                تحليل الكلمات المفتاحية
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                  activeTab === item.id
                    ? "bg-gradient-brand text-white shadow-brand"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg"
              aria-label="تبديل المظهر"
            >
              {mounted && theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-lg"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="القائمة"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="lg:hidden pb-4 pt-2 flex flex-col gap-1 border-t border-border/40 mt-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={cn(
                  "px-4 py-2.5 rounded-lg text-sm font-semibold text-right transition-all",
                  activeTab === item.id
                    ? "bg-gradient-brand text-white shadow-brand"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
