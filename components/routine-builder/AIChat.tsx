"use client";

import { generateRoutineAction } from "@/actions/ai";
import { cn } from "@/lib/utils";
import type { RoutineBlock } from "@/types/database";
import { Plus, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RoutineSuggestionCard } from "./RoutineSuggestionCard";

type Message = {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: string;
  routine?: RoutineBlock[];
};

const QUICK_REPLIES = [
  "컨디션 좋음 💪",
  "어깨 통증 🩹",
  "시간 부족 ⏰",
  "고강도 원해 🔥",
];

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "ai",
      text: "오늘 컨디션은 어떠신가요? 지난 세션 기록을 바탕으로 트레이닝을 준비했습니다.",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await generateRoutineAction(text);

      if (response.error) {
        toast.error(response.error);
        setLoading(false);
        return;
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: response.message,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        routine: response.routine,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      toast.error("AI 응답을 받아오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-6 scrollbar-hide">
        {/* Date Divider */}
        <div className="flex justify-center my-4">
          <span className="text-xs font-medium text-[#9bb8bb] bg-[#1b2627]/50 px-3 py-1 rounded-full border border-white/5">
            오늘
          </span>
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
              msg.role === "user" ? "justify-end" : ""
            )}
          >
            {msg.role === "ai" && (
              <div className="relative shrink-0">
                <div
                  className="bg-center bg-no-repeat bg-cover rounded-full w-10 h-10 border border-white/10"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA__Kf8f50j04Jm0J9D8ESswKk_XKdz4tfTyjkcdH84BWzDbsm5qvL8PEB_0pKFLQ0WNuFunWjPV3JMxH5fh39GP1zSjTbd_BDZT-jPdWHsC1WK0kjeFVaDFrAwQimb-mC2SS9iXtL4jr6G9-EuuEeO_7JAuvcyXkyj9NNL-PDZ8z_p9W530r5scP21KGzEKI2n_9FF1C1gbn265sw3gPZDTNFgr_eiHYO2ev2Fl7olH8XDWXnUV2i-nLVZ8LqPvXj_Dz4OgQSwHijJ")',
                  }}
                ></div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#0f2123] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#1fe7f9] rounded-full"></div>
                </div>
              </div>
            )}

            <div
              className={cn(
                "flex flex-col gap-1 max-w-[85%]",
                msg.role === "user" ? "items-end" : "items-start"
              )}
            >
              {msg.role === "ai" && (
                <span className="text-[#9bb8bb] text-xs ml-1">GripLab AI</span>
              )}

              <div
                className={cn(
                  "p-4 rounded-2xl text-gray-100 shadow-sm border border-white/5 text-[15px] leading-relaxed",
                  msg.role === "ai"
                    ? "bg-[#27383a] rounded-tl-none"
                    : "bg-[#1fe7f9] text-[#0f2123] rounded-tr-none font-medium shadow-[0_0_12px_rgba(31,231,249,0.25)]"
                )}
              >
                {msg.text}
              </div>

              {msg.routine && (
                <RoutineSuggestionCard
                  title="AI 추천 루틴"
                  blocks={msg.routine}
                />
              )}

              <span className="text-[10px] text-gray-500 mx-1">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-[#27383a]"></div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-[#27383a] border border-white/5">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#0f2123]/85 backdrop-blur-md border-t border-gray-800/50 pb-safe shrink-0">
        <div className="flex flex-col gap-3 p-3 pb-4">
          {/* Quick Reply Chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                onClick={() => handleSend(reply)}
                disabled={loading}
                className="shrink-0 px-4 py-2 rounded-full border border-[#1fe7f9]/30 bg-[#1fe7f9]/5 text-[#1fe7f9] text-xs font-medium active:bg-[#1fe7f9]/20 transition-colors whitespace-nowrap backdrop-blur-md disabled:opacity-50"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Input Field */}
          <div className="flex items-end gap-2 bg-[#1b2627] rounded-2xl p-2 border border-white/10 focus-within:border-[#1fe7f9]/50 transition-colors">
            <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5 shrink-0">
              <Plus size={20} />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="w-full bg-transparent border-none text-white placeholder-gray-500 text-sm focus:ring-0 px-0 py-2.5 resize-none max-h-24 leading-relaxed scrollbar-hide"
              placeholder="메시지를 입력하세요..."
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-2 text-[#1fe7f9] hover:text-[#8df5fe] transition-colors rounded-full hover:bg-[#1fe7f9]/10 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} className="fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
