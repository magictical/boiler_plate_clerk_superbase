import { AIChat } from "@/components/routine-builder/AIChat";
import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";

export default function AICoachPage() {
  return (
    <main className="h-screen max-w-[430px] w-full mx-auto bg-[#0f2123] text-white flex flex-col overflow-hidden">
      {/* Top App Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#0f2123] border-b border-gray-800/50 z-20 shrink-0">
        <Link
          href="/routine-builder"
          className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-white text-lg font-bold tracking-tight">
              AI 코치
            </h2>
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </div>
          </div>
          <p className="text-xs text-[#9bb8bb] font-medium tracking-wide">
            GripLab Pro
          </p>
        </div>
        <button className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/5 transition-colors">
          <Settings size={24} />
        </button>
      </header>

      {/* Chat Interface */}
      <AIChat />
    </main>
  );
}
