import { getProfileForSettings } from "@/actions/profiles";
import { TierBadge } from "@/components/common/TierBadge";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { ChevronRight, LogOut, Moon, Settings, Trash2, Volume2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  const { data: profile, error } = await getProfileForSettings();

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d1414] text-white">
        <p className="text-red-400">데이터를 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  const isGuest = profile.home_gym_id === null || profile.current_tier === null;
  const email = clerkUser.emailAddresses[0]?.emailAddress || "이메일 없음";

  return (
    <main className="min-h-screen bg-[#0d1414] text-white font-sans overflow-hidden pb-20 max-w-md mx-auto relative">
      <header className="px-6 py-5 sticky top-0 z-10 bg-[#0d1414]/90 backdrop-blur-md border-b border-white/5">
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
      </header>

      <div className="px-6 py-6 space-y-8">
        {/* Profile Card */}
        <section className="bg-[#162629] rounded-3xl p-6 border border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Settings size={100} />
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-white/10 rounded-full p-1 shrink-0">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-16 h-16"
                  }
                }}
              />
            </div>
            <div className="flex flex-col flex-1">
              <h2 className="text-xl font-bold text-white mb-0.5">{profile.name || "사용자"}</h2>
              <p className="text-sm text-gray-400 mb-2 truncate max-w-[180px]">{email}</p>
              <div className="flex items-center gap-2 h-8 cursor-pointer">
                <Link href="/onboarding/tier-assign" className="transition-all hover:brightness-110 active:scale-95 origin-left block">
                  {profile.current_tier ? (
                    <TierBadge tier={profile.current_tier} className="scale-90 origin-left" />
                  ) : (
                    <span className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-1.5 rounded-lg font-bold inline-block transition-colors border border-white/5">
                      티어 미설정
                    </span>
                  )}
                </Link>
                <Link href="/onboarding/gym-select" className="transition-all hover:brightness-110 active:scale-95 block">
                  {profile.gyms && !Array.isArray(profile.gyms) ? (
                    <span className="text-xs text-[#06e0ce] font-medium border border-[#06e0ce]/30 bg-[#06e0ce]/10 px-3 py-1.5 rounded-lg inline-block">
                      {profile.gyms?.name}
                    </span>
                  ) : (
                    <span className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-1.5 rounded-lg font-bold inline-block transition-colors border border-white/5">
                      홈짐 미설정
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>

          {isGuest && (
            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h3 className="text-sm font-bold text-[#f44336] mb-1">프로필 미완성</h3>
                  <p className="text-xs text-gray-400">데이터를 완성하고 전체 기능을 이용하세요</p>
                </div>
                <span className="text-xs font-bold text-gray-400">0/2</span>
              </div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-[#f44336] w-0 rounded-full" />
              </div>
              <Link href="/onboarding/gym-select" className="mt-4 block w-full bg-white/5 hover:bg-white/10 text-center text-sm font-bold py-3 rounded-xl transition-colors">
                온보딩 이어서 하기
              </Link>
            </div>
          )}
        </section>

        {/* Basic Settings */}
        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-3">앱 설정</h3>
          <div className="bg-[#162629] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3 text-gray-300">
                <Volume2 size={20} className="text-[#06e0ce]" />
                <span className="font-medium">효과음 (타이머)</span>
              </div>
              {/* 토글 스위치 형태 (더미) */}
              <div className="w-12 h-6 rounded-full bg-[#06e0ce]/20 p-1 relative cursor-pointer">
                <div className="w-4 h-4 rounded-full bg-[#06e0ce] absolute right-1"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 text-gray-300">
                <Moon size={20} className="text-purple-400" />
                <span className="font-medium">다크 모드</span>
              </div>
              <div className="w-12 h-6 rounded-full bg-[#06e0ce]/20 p-1 relative cursor-pointer">
                <div className="w-4 h-4 rounded-full bg-[#06e0ce] absolute right-1"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Account Management */}
        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-3">계정 관리</h3>
          <div className="bg-[#162629] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
            <SignOutButton>
              <button className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors w-full text-left cursor-pointer group">
                <div className="flex items-center gap-3 text-gray-300 group-hover:text-white transition-colors">
                  <LogOut size={20} className="text-gray-400 group-hover:text-white" />
                  <span className="font-medium">로그아웃</span>
                </div>
                <ChevronRight size={18} className="text-gray-600" />
              </button>
            </SignOutButton>

            <button className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors w-full text-left group cursor-not-allowed opacity-50">
              <div className="flex items-center gap-3 text-red-400">
                <Trash2 size={20} />
                <span className="font-medium">회원 탈퇴</span>
              </div>
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>
        </section>

        {/* Footer */}
        <div className="flex flex-col items-center justify-center pt-8 pb-4 text-center">
          <p className="text-xs text-gray-600 font-bold tracking-widest">GRIPLAB</p>
          <p className="text-[10px] text-gray-700 mt-1">Version 1.0.0 MVP</p>
        </div>
      </div>
    </main>
  );
}
