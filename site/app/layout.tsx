import type { Metadata } from "next";
import "./globals.css";
const siteUrl = process.env.SITE_URL;
export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl), alternates: { canonical: "/" } } : {}),
  title: "Съёмка одежды в Минске — Gvozdik studio",
  description: "Фото- и видеосъёмка женской одежды и образов под ключ. Gvozdik studio, Алена Гвоздик. Минск и областные города Беларуси. Обсудим вашу съёмку.",
  openGraph: { title: "Gvozdik studio — фото и видео для брендов", description: "Съёмки женской одежды и образов под ключ в Минске и Беларуси", locale: "ru_BY", type: "website", ...(siteUrl ? { url: siteUrl } : {}) },
  twitter: { card: "summary_large_image" },
};
const schema = { "@context": "https://schema.org", "@type": "Organization", name: "Gvozdik studio", description: "Фото- и видеосъёмка женской одежды и образов под ключ", areaServed: ["Минск", "Беларусь"], sameAs: ["https://www.instagram.com/gwozdik/"], ...(siteUrl ? { url: siteUrl } : {}) };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />{children}</body></html>;
}
