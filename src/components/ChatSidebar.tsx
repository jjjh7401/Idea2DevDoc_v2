import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { cn } from "../lib/utils";

import ReactMarkdown from "react-markdown";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  onApplyIdea: (idea: string) => void;
  currentIdea: string;
}

export default function ChatSidebar({ onApplyIdea, currentIdea }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "안녕하세요! 프로젝트 아이디어를 구체화하는 것을 도와드릴게요. 어떤 앱을 만들고 싶으신가요? 아이디어의 내용, 목적, 타겟 사용자, 플랫폼 등에 대해 말씀해 주세요."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const model = "gemini-3-flash-preview"; // Corrected model name

      const systemInstruction = `
        You are an expert AI Product Consultant. Your goal is to help users refine and build up their app ideas.
        Based on the user's input, ask clarifying questions about:
        - Core concept and value proposition
        - Target audience
        - Target platforms (Web, iOS, Android, etc.)
        - Key features and requirements
        - Any specific constraints or non-goals

        Keep the conversation helpful, professional, and encouraging. 
        Use Markdown for formatting to make your response extremely easy to read:
        - Use bold for emphasis.
        - Use bullet points for lists.
        - Use headings (###) for sections.
        - **IMPORTANT**: Use double line breaks between paragraphs and sections to ensure clear visual separation.
        - Avoid long blocks of text; break them into smaller, scannable chunks.

        If the user seems to have a solid idea, summarize it in a structured way that fits the following format:
        - 아이디어 : 
        - 타겟 : 
        - 플랫폼 : 
        - 필수요구사항 : 
        - 요구사항 : 
        - 불필요 :

        Current Idea context: ${currentIdea}
      `;

      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction,
        }
      });

      // Send the whole history for context
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await chat.sendMessage({
        message: userMessage,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "죄송합니다. 응답을 생성하는 중 오류가 발생했습니다." }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `오류가 발생했습니다: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed right-6 bottom-6 z-40 p-4 bg-brand-purple text-white rounded-full shadow-xl hover:scale-110 transition-all",
          isOpen && "hidden"
        )}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white dark:bg-slate-950 shadow-2xl z-50 border-l border-slate-200 dark:border-slate-800 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-purple/10 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-brand-purple" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">아이디어 빌더</h3>
                  <p className="text-[10px] text-slate-500">AI 컨설턴트와 대화하기</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === 'user' ? "bg-slate-200 dark:bg-slate-800" : "bg-brand-purple/10"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-brand-purple" />}
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-brand-purple text-white rounded-tr-none" 
                      : "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-none"
                  )}>
                    <div className="markdown-body chat-markdown prose-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.role === 'assistant' && msg.content.includes('- 아이디어 :') && (
                      <button
                        onClick={() => onApplyIdea(msg.content)}
                        className="mt-3 w-full py-2 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-3 h-3" />
                        아이디어 적용하기
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-brand-purple" />
                  </div>
                  <div className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-purple" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="메시지를 입력하세요..."
                  className="w-full p-3 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-purple outline-none transition-all resize-none text-sm"
                  rows={2}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-2 bg-brand-purple text-white rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                AI가 아이디어를 정리해 주면 '아이디어 적용하기' 버튼이 나타납니다.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
