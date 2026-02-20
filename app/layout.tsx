import { koKR } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SaaS 템플릿",
  description: "Next.js + Clerk + Supabase 보일러플레이트",
  icons: {
    icon: "/favicon.ico",
  },
};

/**
 * 한국어 로컬라이제이션 설정
 * koKR을 기반으로 하되, 커스텀 에러 메시지 추가
 *
 * 참고: Clerk 공식 문서에 따라 localization을 appearance prop 안에 전달합니다.
 * https://clerk.com/docs/guides/customizing-clerk/localization
 */
const koreanLocalization = {
  ...koKR,
  unstable__errors: {
    ...(koKR.unstable__errors || {}),
    // 접근이 허용되지 않은 이메일 도메인
    not_allowed_access:
      "접근이 허용되지 않은 이메일 도메인입니다. 접근 권한이 필요하시면 관리자에게 문의해주세요.",
    // 잘못된 전화번호 형식
    form_param_format_invalid__phone_number:
      "전화번호는 유효한 국제 형식이어야 합니다.",
    // 인증 실패
    form_identifier_not_found: "입력하신 정보로 계정을 찾을 수 없습니다.",
    // 비밀번호가 일치하지 않음
    form_password_incorrect: "비밀번호가 일치하지 않습니다.",
    // 이메일이 이미 사용 중
    form_email_address_not_allowed: "이 이메일 주소는 사용할 수 없습니다.",
    // 전화번호가 이미 사용 중
    form_phone_number_not_allowed: "이 전화번호는 사용할 수 없습니다.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={koreanLocalization}
      appearance={{
        layout: {
          socialButtonsPlacement: "top",
          socialButtonsVariant: "iconButton",
        },
        variables: {
          colorPrimary: "#000000",
          colorText: "#000000",
          colorTextSecondary: "#6b7280",
          fontFamily: "var(--font-geist-sans)",
        },
      }}
    >
      <html lang="ko" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SyncUserProvider>
              {children}
              <Toaster />
            </SyncUserProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
