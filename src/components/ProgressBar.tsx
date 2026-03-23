import { motion } from "motion/react";

interface Props {
  progress: number;
  elapsed: number;
  status: string;
}

export default function ProgressBar({ progress, elapsed, status }: Props) {
  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      <div className="flex justify-between items-end mb-2">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {status}
          </p>
          <p className="text-2xl font-bold font-display">
            {progress}% <span className="text-slate-400 font-normal text-lg ml-2">완료</span>
          </p>
        </div>
        <p className="text-sm text-slate-500 font-mono">
          {elapsed.toFixed(1)}초 경과
        </p>
      </div>
      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-linear-to-r from-brand-purple to-brand-pink"
        />
      </div>
      <p className="mt-4 text-center text-sm text-slate-400 italic">
        "좋은 결과물을 위해 AI가 열심히 작업 중입니다."
      </p>
    </div>
  );
}
