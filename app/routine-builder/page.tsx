import { getProfileForHome } from "@/actions/profiles";
import { GuestGate } from "@/components/routine-builder/GuestGate";
import { ModeSelectCard } from "@/components/routine-builder/ModeSelectCard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function RoutineBuilderPage() {
  const { isGuest } = await getProfileForHome();

  if (isGuest) {
    return <GuestGate />;
  }

  return (
    <main className="min-h-screen max-w-[430px] w-full mx-auto bg-[#0f2123] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 pt-6 pb-2 shrink-0 z-20">
        <Link
          href="/"
          className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 transition-colors text-white"
        >
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-white text-sm font-bold uppercase tracking-widest opacity-60">
          Create Routine
        </h2>
        <div className="size-10"></div>
      </header>

      {/* Headline */}
      <div className="px-6 pb-4 shrink-0 z-20">
        <h1 className="text-[32px] font-bold leading-tight">
          Select Builder Mode
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 pb-8 gap-5 overflow-y-auto">
        <ModeSelectCard variant="ai" href="/routine-builder/ai-coach" />
        <ModeSelectCard variant="custom" href="/routine-builder/editor" />
      </div>
      
      {/* Bottom Spacer */}
      <div className="h-6 w-full shrink-0"></div>
    </main>
  );
}
