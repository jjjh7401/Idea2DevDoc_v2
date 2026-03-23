import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Settings2, ChevronDown, ChevronUp, Sparkles, Zap, ShieldCheck, Layout, ListTodo, Share2 } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import Navbar from "./components/Navbar";
import ProgressBar from "./components/ProgressBar";
import DocumentViewer from "./components/DocumentViewer";
import HistoryPage from "./pages/HistoryPage";
import ChatSidebar from "./components/ChatSidebar";
import { GenerationOptions, HistoryItem, SpecDocs, DOC_TYPES } from "./types";
import { cn } from "./lib/utils";
import { Check, CheckSquare, Square } from "lucide-react";

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'history'>('home');
  const [idea, setIdea] = useState("");
  const [options, setOptions] = useState<GenerationOptions>({
    detailLevel: 'Full',
    language: 'ko',
    selectedDocs: [...DOC_TYPES]
  });
  const [docSelectionMode, setDocSelectionMode] = useState<'all' | 'custom'>('all');
  const [showOptions, setShowOptions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<SpecDocs | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isGenerating) {
      timerRef.current = window.setInterval(() => {
        setElapsed((prev) => prev + 0.1);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!idea.trim()) return;

    setIsGenerating(true);
    setProgress(0);
    setElapsed(0);
    setResult(null);
    setError(null);
    setStatus("프로젝트 아이디어 분석 중...");

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.floor(Math.random() * 5);
      });
      
      const statuses = [
        "프로젝트 아이디어 분석 중...",
        "시스템 기준 정의 중...",
        "PRD 초안 작성 중...",
        "아키텍처 구조 설계 중...",
        "태스크 목록 생성 중...",
        "유저 스토리 작성 중...",
        "기술 스택 선정 중...",
        "문서 최종 마무리 중..."
      ];
      setStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 1500);

    try {
      const apiKey = (window as any).GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
      if (!apiKey) {
        throw new Error("Gemini API 키가 설정되지 않았습니다. 관리자에게 문의하세요.");
      }
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3.1-pro-preview";
      
      const selectedDocsList = docSelectionMode === 'all' ? DOC_TYPES : options.selectedDocs;

      const systemInstruction = `
# SYSTEM PROMPT — Idea2DevDocs (v1.0)

You are **Idea2DevDocs**, a senior software architect + product manager + tech lead hybrid.
Your mission: turn a **simple app idea** into a **complete, implementation-ready development document package** that a real team can build immediately.

You must output documents that are:
- **Concrete** (numbers, acceptance criteria, API contracts, file paths, states, edge cases)
- **Consistent** across all documents (same feature IDs, same endpoints, same data model)
- **Degraded-mode safe** (failures never collapse the UX; always provide fallback paths)
- **SLO-aware** (performance targets per pipeline stage)
- **Developer handoff-ready** (tasks, directory tree, test scenarios, wireframe flow)

---

## 1) OUTPUT PACKAGE (deliverables)

You must generate ONLY the following files as requested:
${selectedDocsList.map((doc, i) => `${i + 1}. ${doc}`).join('\n')}

### Hard rules
- Use consistent IDs everywhere:
  - Features: F-001, F-002...
  - Tasks: T-001, T-002...
  - User Stories: US-001...
  - Tests: TC-001...
- Every Feature (F-xxx) must map to:
  - at least 1 User Story (US-xxx)
  - at least 1 Task (T-xxx)
  - at least 1 Test Scenario (TC-xxx)
- Include **Mermaid diagrams** in ARCHITECTURE.md (if requested):
  - Flowchart + Sequence diagram (minimum)
- Include **SLO table** in SYSTEM_BASELINE.md (if requested):
  - T1~T4 + E2E with p95/p99/max targets
- Include **Degraded Mode** strategies across:
  - crawling/parsing failures, missing data, model failures, timeout, blocked domains, image failures, etc.
- Avoid vague statements like “optimize performance.” Replace with measurable targets, retry policies, and failure behaviors.

---

## 2) QUALITY BAR (what “professional” means here)

### Must include
- Clear **Goals / Non-goals**
- Precise **Functional Requirements** with acceptance criteria
- **Non-functional Requirements**: performance, security, observability, scalability
- **Data contracts** (request/response JSON schemas)
- **State machine** or explicit job statuses (e.g., pending/running/success/failed/degraded)
- **Rate limiting** and robots/terms compliance if any external fetching exists
- **Logging/Monitoring plan** (metrics + alerts)
- **Risks & mitigations** (top 5)

---

## 3) DEFAULT DESIGN PATTERNS (apply unless user overrides)

### 3.1 Pipeline segmentation
Define a pipeline with stages (example naming; adjust to idea):
- T1: Input acquisition (e.g., fetch/crawl/upload/ingest)
- T2: Extraction/Parsing/Structuring
- T3: AI generation / transformation
- T4: UI render + export
And define E2E.

### 3.2 Degraded Mode (mandatory)
Implement a 3-level degraded strategy:
1) Reuse cache / last successful output if safe  
2) Use template/rule-based fallback  
3) Provide empty editor + guidance message (manual completion path)

### 3.3 Document generation style
Prefer:
- Tables for requirements and mappings
- Concrete examples of payloads
- Explicit timeouts, retries, and thresholds
- “Copy/paste ready” directory trees and sample configs

---

## 4) REQUIRED CONTENT PER FILE (if requested)

### (1) Agent.md
Create a professional Claude Code agent definition that gives the project a distinct **Persona**.
**Structure**:
1. **Header**: At the very top, use the following plain text format:
   Name : [project-name]-agent
   Description : [Natural language explanation of when to invoke]
2. **Markdown Content**:
   - **Persona Introduction**: "You are a [Role] specialist working as part of an agent team."
   - **Role & Function**: Define the core identity and what the agent is responsible for.
   - **Detailed Workflow**: Step-by-step guidelines for how the agent operates.
   - **Communication Rules**: How to coordinate with other agents.
   - **Quality Standards**: Measurable criteria for success.

### (2) Skill.md
Create a professional Claude Code skill that provides the **Professional Knowledge and Information** required to run the app.
**Structure**:
1. **Header**: At the very top, use the following plain text format:
   Name : custom-[project-name]-skill
   Description : [3rd person explanation of what it does]
2. **Markdown Content**:
   - **Skill Extensions**: Define Progressive Disclosure levels and Triggers.
   - **Core Knowledge Base**: Detailed technical information and domain-specific logic.
   - **Quick Reference**: Essential patterns and "cheat sheets".
   - **Implementation Guide**: Deep-dive into how to use the knowledge.
   - **Advanced Patterns**: Expert-level configurations and optimization.
   - **Works Well With**: Integration points.

### (3) PRD.md
Include: Overview, Goals / Non-goals, Personas + primary use cases, Feature list (F-001...) with acceptance criteria, UX requirements, Performance targets, Security & compliance, Success metrics, Milestones.

### (2) ARCHITECTURE.md
Include: Architecture overview, Components table, Mermaid flowchart + sequence diagram, Data flow + storage strategy, ADR mini-section, Deployment architecture.

### (3) DIRECTORY_STRUCTURE.md
Include: A complete repo tree, Responsibility notes for key modules, Config conventions, Docs folder structure.

### (4) TECH_STACK.md
Include: Proposed stack (with version ranges), Rationale per category, Alternatives considered, Minimal requirements.txt / package.json skeletons.

### (5) TASKS.md
Include: T-001... tasks with dependencies, estimated effort, input/output artifacts, acceptance criteria checkboxes, implementation notes.

### (6) USER_STORIES.md
Include: Epics, US-xxx with “As a / I want / so that”, Acceptance criteria in Given/When/Then format.

### (7) TEST_SCENARIOS.md
Include: Unit tests (TC-xxx), Integration tests, E2E tests, Edge cases + degraded-mode tests, Priority labels (P0/P1/P2).

### (8) WIREFRAME.md
Include: Flow diagram (ASCII), Screen-by-screen wireframes (ASCII blocks), UI states, CTA/button list.

### (9) SYSTEM_BASELINE.md
Include: Definition of each timing segment, p95/p99/max targets per segment, Alert thresholds, Observability requirements, Notes on cache and async behavior, “Failure behavior contract”.

---

## 5) CONSISTENCY CHECK
Before output, validate internally:
- Same endpoint names appear in PRD/Architecture/Tasks/Tests
- Same schemas and field names appear everywhere
- Every Feature has ≥1 story/task/test
- Degraded-mode behavior is defined for every failure class relevant to the idea
- The wireframe screens align with the pipeline and statuses

Return the result as a JSON object where keys are the document names (e.g., "PRD.md", "ARCHITECTURE.md") and values are the markdown content.
Do not add extra commentary outside the JSON.
`;

      const properties: any = {};
      // Ensure documents follow the order in DOC_TYPES
      const orderedDocs = [...selectedDocsList].sort((a, b) => {
        return DOC_TYPES.indexOf(a) - DOC_TYPES.indexOf(b);
      });

      orderedDocs.forEach(doc => {
        properties[doc] = { type: Type.STRING };
      });

      const response = await ai.models.generateContent({
        model,
        contents: `Project Idea: "${idea}"\nDetail Level: ${options.detailLevel}\nLanguage: ${options.language === 'ko' ? 'Korean' : 'English'}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties,
            required: selectedDocsList
          }
        }
      });

      const docs = JSON.parse(response.text);
      
      // Save to history via backend
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, docs })
      });

      clearInterval(progressInterval);
      setProgress(100);
      setStatus("생성 완료!");
      setResult(docs);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setIdea(item.idea);
    setResult(item.docs);
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleGenerate();
    }
    if (e.key === 'Escape' && isGenerating) {
      // In a real app, we might abort the fetch
      setIsGenerating(false);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('idea-input')?.focus();
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-brand-purple/20" onKeyDown={handleKeyDown}>
      <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />

      <main className="pb-20">
        <AnimatePresence mode="wait">
          {currentPage === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            >
              {/* Hero Section */}
              <section className="pt-8 pb-6 md:pt-12 md:pb-8 text-center">
                <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight mb-4">
                  <span className="gradient-text">Idea2DevDoc</span>
                </h1>
                <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-0">
                  아이디어를 단 몇 분 만에 전문적인 개발 문서로 만들어보세요. <br />
                  PRD부터 와이어프레임까지 모두 한번에 끝!!
                </p>
              </section>

              {/* Input Section */}
              <section className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-10">
                  <div className="relative mb-6">
                    <textarea
                      id="idea-input"
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      placeholder="- 아이디어 : &#10;- 타겟 : &#10;- 플랫폼 : &#10;- 필수요구사항 : &#10;- 요구사항 : &#10;- 불필요 :"
                      className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-purple focus:border-transparent outline-none transition-all resize-none text-lg"
                    />
                    <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-mono">
                      ⌘ + Enter로 생성
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <button
                      onClick={() => setShowOptions(!showOptions)}
                      className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-purple transition-colors"
                    >
                      <Settings2 className="w-4 h-4" />
                      고급 설정
                      {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !idea.trim()}
                      className="w-full md:w-auto px-8 py-4 bg-linear-to-r from-brand-purple to-brand-pink text-white font-bold rounded-2xl shadow-lg shadow-brand-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      {isGenerating ? "생성 중..." : "문서 생성하기"}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showOptions && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                          <div>
                            <label className="block text-sm font-bold mb-2">상세도</label>
                            <div className="flex gap-2">
                              {['Full', 'Minimal'].map((level) => (
                                <button
                                  key={level}
                                  onClick={() => setOptions({ ...options, detailLevel: level as any })}
                                  className={cn(
                                    "flex-1 py-2 rounded-xl border text-sm font-medium transition-all",
                                    options.detailLevel === level
                                      ? "bg-brand-purple text-white border-brand-purple"
                                      : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-500"
                                  )}
                                >
                                  {level === 'Full' ? '상세' : '최소'}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-bold mb-2">출력 언어</label>
                            <div className="flex gap-2">
                              {[
                                { id: 'ko', label: '한국어' },
                                { id: 'en', label: 'English' }
                              ].map((lang) => (
                                <button
                                  key={lang.id}
                                  onClick={() => setOptions({ ...options, language: lang.id as any })}
                                  className={cn(
                                    "flex-1 py-2 rounded-xl border text-sm font-medium transition-all",
                                    options.language === lang.id
                                      ? "bg-brand-purple text-white border-brand-purple"
                                      : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-500"
                                  )}
                                >
                                  {lang.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold mb-4">문서 생성 범위</label>
                            <div className="flex gap-4 mb-4">
                              {[
                                { id: 'all', label: '전체 생성' },
                                { id: 'custom', label: '선택 생성' }
                              ].map((mode) => (
                                <button
                                  key={mode.id}
                                  onClick={() => setDocSelectionMode(mode.id as any)}
                                  className={cn(
                                    "flex-1 py-2 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2",
                                    docSelectionMode === mode.id
                                      ? "bg-brand-purple text-white border-brand-purple"
                                      : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-500"
                                  )}
                                >
                                  {docSelectionMode === mode.id ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                  {mode.label}
                                </button>
                              ))}
                            </div>

                            {docSelectionMode === 'custom' && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800"
                              >
                                {DOC_TYPES.map((doc) => (
                                  <label 
                                    key={doc} 
                                    className="flex items-center gap-2 cursor-pointer group"
                                  >
                                    <input
                                      type="checkbox"
                                      className="hidden"
                                      checked={options.selectedDocs.includes(doc)}
                                      onChange={(e) => {
                                        const newSelected = e.target.checked
                                          ? [...options.selectedDocs, doc]
                                          : options.selectedDocs.filter(d => d !== doc);
                                        setOptions({ ...options, selectedDocs: newSelected });
                                      }}
                                    />
                                    <div className={cn(
                                      "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                      options.selectedDocs.includes(doc)
                                        ? "bg-brand-purple border-brand-purple text-white"
                                        : "border-slate-300 dark:border-slate-600 group-hover:border-brand-purple"
                                    )}>
                                      {options.selectedDocs.includes(doc) && <Check className="w-3 h-3" />}
                                    </div>
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-brand-purple transition-colors">
                                      {doc}
                                    </span>
                                  </label>
                                ))}
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Progress / Error / Result */}
                <div className="mt-12">
                  {isGenerating && (
                    <ProgressBar progress={progress} elapsed={elapsed} status={status} />
                  )}

                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-center">
                      {error}
                    </div>
                  )}

                  {result && !isGenerating && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold font-display">생성된 문서</h2>
                        <div className="flex gap-2">
                          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-medium hover:bg-slate-200 transition-colors">
                            <Share2 className="w-4 h-4" />
                            공유하기
                          </button>
                        </div>
                      </div>
                      <DocumentViewer docs={result} idea={idea} />
                    </motion.div>
                  )}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <HistoryPage onSelect={handleSelectHistory} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ChatSidebar 
        currentIdea={idea} 
        onApplyIdea={(newIdea) => {
          setIdea(newIdea);
          // Focus the textarea
          document.getElementById('idea-input')?.focus();
        }} 
      />
    </div>
  );
}
