import { getProfileForHome } from "@/actions/profiles";
import { GuestGate } from "@/components/routine-builder/GuestGate";
import { ModeSelectCard } from "@/components/routine-builder/ModeSelectCard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function RoutineBuilderPage() {
  const { isGuest } = await getProfileForHome();

  if (isGuest) {
    return <GuestGate />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1414] text-white font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0d1414]/95 backdrop-blur-md px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 active:bg-white/10 transition-colors text-gray-300"
          >
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-lg font-bold tracking-tight text-gray-100">
            모드 선택
          </h2>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-md mx-auto p-6 space-y-5">
        <ModeSelectCard variant="ai" href="/routine-builder/ai-coach" />
        <ModeSelectCard variant="custom" href="/routine-builder/editor" />
      </main>

      {/* Bottom Spacer */}
      <div className="h-6 w-full shrink-0"></div>
    </div>
  );
}
