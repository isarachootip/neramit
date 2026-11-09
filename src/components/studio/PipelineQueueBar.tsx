"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Layers, Loader2, RefreshCw } from "lucide-react";
import { QueueJobItem } from "@/domain/neramit-vault-types";
import { StudioLocale } from "@/domain/studio-types";

interface PipelineQueueBarProps {
  jobs: QueueJobItem[];
  simulateFailure: boolean;
  onToggleSimulateFailure: (val: boolean) => void;
  locale: StudioLocale;
}

export function PipelineQueueBar({
  jobs,
  simulateFailure,
  onToggleSimulateFailure,
  locale,
}: PipelineQueueBarProps) {
  const runningCount = jobs.filter((j) => j.status === "running").length;

  return (
    <div className="neramit-glass flex flex-col gap-2.5 rounded-3xl p-3.5 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-violet-400" />
          <span className="text-xs font-extrabold">
            {locale === "th"
              ? `คิวประมวลผลพร้อมกัน (Concurrent Queue: ${runningCount}/4 งาน)`
              : `Concurrent Pipeline Queue (${runningCount}/4 Active Jobs)`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onToggleSimulateFailure(!simulateFailure)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
            simulateFailure
              ? "bg-amber-500/20 text-amber-300 border border-amber-400/40"
              : "neu-pressed text-[var(--muted-foreground)]"
          }`}
        >
          <RefreshCw className="size-3" />
          <span>
            {locale === "th"
              ? simulateFailure
                ? "เปิดทดสอบ Auto-Refund เมื่อล้มเหลวอยู่"
                : "ทดสอบระบบคืน Token อัตโนมัติ (Simulate Fail)"
              : simulateFailure
              ? "Auto-Refund Failure Test: ON"
              : "Test Auto-Refund on Failure"}
          </span>
        </button>
      </div>

      {jobs.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {jobs.slice(0, 5).map((job) => (
            <div
              key={job.id}
              className="neu-pressed flex min-w-[220px] items-center justify-between gap-2 rounded-2xl px-3 py-2 text-xs"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-bold">{job.modelTitle}</span>
                <span className="truncate text-[10px] text-[var(--muted-foreground)]">
                  {job.prompt}
                </span>
              </div>
              {job.status === "running" ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-violet-400">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>-{job.tokensReserved}</span>
                </span>
              ) : job.status === "failed" ? (
                <span className="flex items-center gap-1 text-[11px] font-extrabold text-amber-400">
                  <AlertTriangle className="size-3.5" />
                  <span>+{job.refundedTokens} Refunded</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  <span>Done</span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
