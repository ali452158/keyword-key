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
import { KeyRound, Github, Twitter, Linkedin, Heart } from "lucide-react"

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
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-gradient-brand-soft dark:bg-card/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                href="#"
                aria-label="Twitter"
                className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
              >
                <Linkedin className="w-4 h-4" />
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
            لمحترفي السوشيال ميديا
          </p>
        </div>
      </div>
    </footer>
  )
}
