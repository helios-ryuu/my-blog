import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import AppShell from "@/components/layout/AppShell";
import { SITE_DESCRIPTION, SITE_NAME } from "@/config/site";
import { getAccentColor } from "@/lib/site-settings";
import "./globals.css";

const lexend = Lexend({
    subsets: ["latin", "vietnamese"],
    variable: "--font-lexend",
    display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3456";

export const viewport: Viewport = { viewportFit: "cover" };

export const metadata: Metadata = {
    title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    metadataBase: new URL(siteUrl),
    openGraph: {
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
        url: siteUrl,
        siteName: SITE_NAME,
        images: [{ url: "/favicon.ico", width: 512, height: 512, alt: SITE_NAME }],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
        images: ["/favicon.ico"],
    },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const [locale, messages, accentColor] = await Promise.all([getLocale(), getMessages(), getAccentColor()]);
    const accentStyle = {
        "--accent": accentColor,
        "--accent-hover": `color-mix(in srgb, ${accentColor} 84%, white)`,
        "--chart-1": accentColor,
    } as CSSProperties;

    return (
        <html lang={locale} suppressHydrationWarning style={accentStyle}>
            <body className={`${lexend.variable} max-h-screen antialiased`}>
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <AppShell initialAccentColor={accentColor}>{children}</AppShell>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
