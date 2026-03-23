import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { SpecDocs, DOC_TYPES } from "../types";
import { Copy, Download, Eye, FileText, Check } from "lucide-react";
import JSZip from "jszip";
import { cn } from "../lib/utils";

interface Props {
  docs: SpecDocs;
  idea: string;
}

export default function DocumentViewer({ docs, idea }: Props) {
  const docKeys = Object.keys(docs).sort((a, b) => {
    return DOC_TYPES.indexOf(a) - DOC_TYPES.indexOf(b);
  });
  const [activeTab, setActiveTab] = useState(docKeys[0]);
  const [copied, setCopied] = useState(false);
  const [viewRaw, setViewRaw] = useState(false);

  const getProjectName = () => {
    // Try to extract project name from idea string
    const match = idea.match(/- 아이디어\s*:\s*(.*)/);
    if (match && match[1]) return match[1].trim();
    return idea.split('\n')[0].trim().substring(0, 30) || "project";
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(docs[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const projectName = getProjectName();
    
    docKeys.forEach((key) => {
      let fileName = key;
      if (key === "Agent.md") {
        fileName = `${projectName} Agent.md`;
      } else if (key === "Skill.md") {
        fileName = `${projectName} Skill.md`;
      }
      zip.file(fileName.replace(/\s+/g, '_'), docs[key]);
    });
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project_specs.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      <div className="flex flex-col md:flex-row border-b border-slate-200 dark:border-slate-800">
        <div className="flex-1 flex overflow-x-auto no-scrollbar">
          {docKeys.map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2",
                activeTab === key
                  ? "border-brand-purple text-brand-purple bg-slate-50 dark:bg-slate-800/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {key}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 p-2 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setViewRaw(!viewRaw)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            title="원본/마크다운 전환"
          >
            {viewRaw ? <Eye className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </button>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            title="클립보드 복사"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownloadZip}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            title="전체 ZIP 다운로드"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 max-h-[600px] overflow-y-auto">
        {viewRaw ? (
          <pre className="font-mono text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
            {docs[activeTab]}
          </pre>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown>{docs[activeTab]}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
