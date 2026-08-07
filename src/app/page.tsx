"use client"

import * as React from "react"
import { SiteHeader } from "@/components/site-header"
import { Dashboard } from "@/components/sections/dashboard"
import { KeywordResearch } from "@/components/sections/keyword-research"
import { Trends } from "@/components/sections/trends"
import { CompetitorAnalysis } from "@/components/sections/competitor-analysis"
import { ContentGenerator } from "@/components/sections/content-generator"
import { SocialIntegration } from "@/components/sections/social-integration"
import { GrowthTools } from "@/components/sections/growth-tools"
import { CreatorCard } from "@/components/creator-card"
import { FloatingTelegram } from "@/components/floating-telegram"
import { TelegramIcon } from "@/components/telegram-icon"
import { TikTokIcon } from "@/components/tiktok-icon"
import { InstagramIcon } from "@/components/instagram-icon"
import { YouTubeIcon } from "@/components/youtube-icon"
import { KeyRound, Heart, Send } from "lucide-react"

type TabId =
  | "dashboard"
  | "research"
  | "trends"
  | "competitor"
  | "generator"
  | "integration"
  | "growth"

export default function Home() {
  const [activeTab, setActiveTab] = React.useState<TabId>("dashboard")
  const [researchKeyword, setResearchKeyword] = React.useState<string>()
  const [generatorKeyword, setGeneratorKeyword] = React.useState<string>()

  const handleNavigate = (tab: string, keyword?: string) => {
    const tabId = tab as TabId
    setActiveTab(tabId)
    if (tabId === "research" && keyword) {
      setResearchKeyword(keyword)
    }
    if (tabId === "generator" && keyword) {
      setGeneratorKeyword(keyword)
    }
    // Reset keyword state when navigating away to avoid stale pre-fill
    if (tabId !== "research") setResearchKeyword(undefined)
    if (tabId !== "generator") setGeneratorKeyword(undefined)
  }

  const handleTabChange = (tab: string) => {
    const tabId = tab as TabId
    setActiveTab(tabId)
    setResearchKeyword(undefined)
    setGeneratorKeyword(undefined)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {activeTab === "dashboard" && (
            <Dashboard onNavigate={handleNavigate} />
          )}
          {activeTab === "research" && (
            <KeywordResearch
              key={researchKeyword || "default"}
              initialKeyword={researchKeyword}
              onNavigate={handleNavigate}
            />
          )}
          {activeTab === "trends" && <Trends onNavigate={handleNavigate} />}
          {activeTab === "competitor" && (
            <CompetitorAnalysis onNavigate={handleNavigate} />
          )}
          {activeTab === "generator" && (
            <ContentGenerator
              key={generatorKeyword || "default"}
              initialKeyword={generatorKeyword}
              onNavigate={handleNavigate}
            />
          )}
          {activeTab === "integration" && (
            <SocialIntegration onNavigate={handleNavigate} />
          )}
          {activeTab === "growth" && <GrowthTools />}
        </div>
      </main>

      <Footer />
      <FloatingTelegram />
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-gradient-brand-soft dark:bg-card/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Creator strip */}
        <CreatorCard />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-brand">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-extrabold text-lg text-gradient-brand">
                  Keyword Key
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  تحليل الكلمات المفتاحية للسوشيال ميديا
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              منصة متكاملة لتحليل الكلمات المفتاحية على TikTok و YouTube و
              Instagram و Facebook. اكتشف الترندات، حلل المنافسين، وولّد أفكار
              محتوى بذكاء.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <a
                href="https://t.me/FX_pulssGold"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="قناة تلجرام FX_pulssGold"
                className="w-9 h-9 rounded-lg bg-[#229ED9] flex items-center justify-center text-white hover:bg-[#1b8dc4] hover:-translate-y-0.5 transition-all"
              >
                <TelegramIcon size={18} className="text-white" />
              </a>
              <a
                href="https://t.me/ali_0165"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="حساب تلجرام ali_0165"
                className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="https://www.tiktok.com/@ali.trad011"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="حساب تيك توك ali.trad011"
                className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#25F4EE] via-[#000000] to-[#FE2C55] flex items-center justify-center text-white hover:-translate-y-0.5 transition-all"
              >
                <TikTokIcon size={16} className="text-white" />
              </a>
              <a
                href="https://www.instagram.com/alitredr0"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="حساب انستجرام alitredr0"
                className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white hover:-translate-y-0.5 transition-all"
              >
                <InstagramIcon size={16} className="text-white" />
              </a>
              <a
                href="https://www.youtube.com/@ali.c.u"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="قناة يوتيوب ali.c.u"
                className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FF0000] to-[#CC0000] flex items-center justify-center text-white hover:-translate-y-0.5 transition-all"
              >
                <YouTubeIcon size={16} className="text-white" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">
              الأدوات
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  بحث الكلمات المفتاحية
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  الترندات اليومية
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  تحليل المنافسين
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  مولّد الأفكار
                </a>
              </li>
            </ul>
          </div>

          {/* Platforms */}
          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">
              المنصات المدعومة
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">TikTok — تيك توك</li>
              <li className="text-muted-foreground">YouTube — يوتيوب</li>
              <li className="text-muted-foreground">Instagram — انستجرام</li>
              <li className="text-muted-foreground">Facebook — فيسبوك</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Keyword Key. جميع الحقوق محفوظة.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            صُنع بـ
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            بواسطة
            <span className="font-semibold text-gradient-brand">ali tredr</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
