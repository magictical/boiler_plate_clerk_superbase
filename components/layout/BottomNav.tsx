"use client";

import { Home, ListTodo, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  // 온보딩 중이거나 훈련 진입, 에디터(빌더) 화면, 로그인 화면일 경우 하단 네비게이션 숨김
  if (
    pathname?.startsWith("/onboarding") ||
    pathname?.includes("/workout/") ||
    pathname?.startsWith("/routine-builder") ||
    pathname?.startsWith("/sign-in") ||
    pathname?.startsWith("/sign-up")
  ) {
    return null;
  }

  const navItems = [
    { label: "홈", icon: Home, href: "/" },
    { label: "루틴", icon: ListTodo, href: "/routines" },
    { label: "설정", icon: Settings, href: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 w-full max-w-[430px] z-50 bg-[#0f2123]/95 backdrop-blur-md border-t border-white/10 pb-safe left-1/2 -translate-x-1/2">
      <div className="flex justify-around items-center h-16 w-full px-2">
        {navItems.map((item) => {
          // 정확한 경로이거나, 홈("/")이 아니면서 해당 경로로 시작할 때 활성화
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? "text-[#1fe7f9]" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
