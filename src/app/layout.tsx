import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Keyword Key - أداة تحليل الكلمات المفتاحية للسوشيال ميديا",
  description:
    "منصة متكاملة لتحليل الكلمات المفتاحية على TikTok و YouTube و Instagram و Facebook. اكتشف الترندات، حلل المنافسين، وولّد أفكار محتوى بذكاء.",
  keywords: [
    "تحليل الكلمات المفتاحية",
    "تيك توك",
    "يوتيوب",
    "انستجرام",
    "فيسبوك",
    "ترندات",
    "السوشيال ميديا",
    "Keyword Key",
  ],
  authors: [{ name: "Keyword Key" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Keyword Key - تحليل الكلمات المفتاحية",
    description: "اكتشف الكلمات الأكثر انتشاراً وولّد أفكار محتوى بذكاء",
    siteName: "Keyword Key",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${tajawal.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
