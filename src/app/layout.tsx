import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const lexend = Lexend({
  subsets: ["latin", "vietnamese"],
  variable: "--font-lexend",
  display: "swap",
});

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Toán Mô Hình Hà Nội",
  description: "Cổng thông tin chính thức của Toán Mô Hình Hà Nội — chia sẻ kiến thức toán mô hình, cuộc thi, và tài nguyên cho cộng đồng.",
  metadataBase: new URL("https://toanmohinhvietnam.com"),
  openGraph: {
    title: "Toán Mô Hình Hà Nội",
    description: "Cổng thông tin chính thức của Toán Mô Hình Hà Nội — chia sẻ kiến thức toán mô hình, cuộc thi, và tài nguyên cho cộng đồng.",
    url: "https://toanmohinhvietnam.com",
    siteName: "Toán Mô Hình Hà Nội",
    images: [
      {
        url: "/favicon.ico",
        width: 512,
        height: 512,
        alt: "Toán Mô Hình Hà Nội",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Toán Mô Hình Hà Nội",
    description: "Cổng thông tin chính thức của Toán Mô Hình Hà Nội — chia sẻ kiến thức toán mô hình, cuộc thi, và tài nguyên cho cộng đồng.",
    images: ["/favicon.ico"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${lexend.variable} antialiased max-h-screen`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppShell>{children}</AppShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
