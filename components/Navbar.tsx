"use client";

import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import { Mountain } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const pathname = usePathname();
  if (pathname?.startsWith("/onboarding")) return null;

  const isHome = pathname === "/";
  return (
    <header
      className={`flex justify-between items-center px-5 pt-4 pb-4 h-16 max-w-[430px] mx-auto ${
        isHome ? "bg-[#0f2123]" : ""
      }`}
    >
      <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
        <Mountain className="w-8 h-8 text-[#1fe7f9]" />
        GripLab
      </Link>
      <div className="flex gap-4 items-center">
        <SignedOut>
          <SignInButton
            mode="modal"
            fallbackRedirectUrl={pathname || "/"}
            oauthFlow="popup"
          >
            <Button>로그인</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
};

export default Navbar;
