import { useState } from "react";
import {
  CheckCircle2,
  CircleDotDashed,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ToolStep } from "@/hooks/useAgent";

// ── Animation variants (from agent-plan style) ─────────────────────────────
const stepIn = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 500, damping: 30 },
  },
  exit: { opacity: 0, x: -8, transition: { duration: 0.15 } },
};

const expandDown = {
  hidden: { opacity: 0, height: 0, overflow: "hidden" },
  visible: {
    height: "auto",
    opacity: 1,
    overflow: "visible",
    transition: { duration: 0.22, ease: [0.2, 0.65, 0.3, 0.9] },
  },
  exit: {
    height: 0,
    opacity: 0,
    overflow: "hidden",
    transition: { duration: 0.18, ease: [0.2, 0.65, 0.3, 0.9] },
  },
};

// ── Label helper ───────────────────────────────────────────────────────────
const label = (name: string) => name.replace(/_/g, " ");

// ── Single step row ────────────────────────────────────────────────────────
function StepRow({
  name,
  running = false,
  dim = false,
}: {
  name: string;
  running?: boolean;
  dim?: boolean;
}) {
  return (
    <motion.li
      variants={stepIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex items-center gap-2 py-0.5"
    >
      {running ? (
        <CircleDotDashed className="h-3.5 w-3.5 flex-shrink-0 text-blue-400 animate-pulse" />
      ) : (
        <CheckCircle2
          className={cn(
            "h-3.5 w-3.5 flex-shrink-0",
            dim ? "text-emerald-500/50" : "text-emerald-500"
          )}
        />
      )}
      <span
        className={cn(
          "text-[11px] font-mono",
          running ? "text-ink-2" : dim ? "text-ink-6" : "text-ink-5"
        )}
      >
        {label(name)}
      </span>
    </motion.li>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function ToolStepper({ tools }: { tools: ToolStep[] }) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  if (!tools.length) return null;

  const running = tools.filter((t) => !t.done);   // may be multiple (parallel)
  const completed = tools.filter((t) => t.done);
  const allDone = running.length === 0;

  // ── ALL DONE → single "Activity" disclosure ────────────────────────────
  if (allDone) {
    return (
      <div className="mb-3">
        <button
          onClick={() => setActivityOpen((o) => !o)}
          className="flex items-center gap-1.5 text-xs text-ink-6 hover:text-ink-4 transition-colors duration-150"
        >
          <ChevronDown
            size={10}
            className={cn(
              "transition-transform duration-200",
              activityOpen && "rotate-180"
            )}
          />
          <span>Activity ({tools.length})</span>
        </button>

        <AnimatePresence>
          {activityOpen && (
            <motion.div variants={expandDown} initial="hidden" animate="visible" exit="exit">
              <div className="relative mt-1.5 pl-1">
                {tools.length > 1 && (
                  <div className="absolute top-1.5 bottom-1.5 left-[6px] border-l border-dashed border-line-connector" />
                )}
                <ul className="space-y-px">
                  {tools.map((t) => (
                    <StepRow key={t.id} name={t.name} dim />
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── RUNNING → completed overflow + visible recent + all running ────────
  // Visible budget: 3 slots total. Running tools always shown.
  // Remaining slots filled with most-recent completed. Rest overflow.
  const visibleCompletedCount = Math.max(0, 3 - running.length);
  const recentCompleted = completed.slice(-visibleCompletedCount);
  const overflowed = completed.slice(0, -visibleCompletedCount);
  const connectorCount = recentCompleted.length + running.length;

  return (
    <div className="mb-3">
      {/* Overflow dropdown — oldest completed */}
      {overflowed.length > 0 && (
        <div className="mb-1">
          <button
            onClick={() => setOverflowOpen((o) => !o)}
            className="flex items-center gap-1.5 text-[11px] text-ink-7 hover:text-ink-5 transition-colors duration-150"
          >
            <ChevronDown
              size={10}
              className={cn("transition-transform duration-200", overflowOpen && "rotate-180")}
            />
            <span>{overflowed.length} more</span>
          </button>

          <AnimatePresence>
            {overflowOpen && (
              <motion.div variants={expandDown} initial="hidden" animate="visible" exit="exit">
                <ul className="mt-1 pl-1 space-y-px">
                  {overflowed.map((t) => (
                    <StepRow key={t.id} name={t.name} dim />
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Visible: recent completed + all currently running */}
      <div className="relative">
        {connectorCount > 1 && (
          <div className="absolute top-2 bottom-2 left-[6px] border-l border-dashed border-line-connector" />
        )}
        <ul className="space-y-px">
          <AnimatePresence>
            {recentCompleted.map((t) => (
              <StepRow key={t.id} name={t.name} />
            ))}
          </AnimatePresence>

          {/* All running tools — pulsing, shown simultaneously */}
          {running.map((t) => (
            <StepRow key={t.id} name={t.name} running />
          ))}
        </ul>
      </div>
    </div>
  );
}
