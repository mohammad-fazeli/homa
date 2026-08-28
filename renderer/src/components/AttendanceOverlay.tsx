import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, CreditCard, Clock, Undo2 } from "lucide-react";
import type { UseSessionResult } from "../global";

export default function AttendanceOverlay({
  result,
  onClose,
}: {
  result: UseSessionResult | null;
  onClose: () => void;
}) {
  const kind =
    result?.code === "OK"
      ? "success"
      : result?.code === "ALREADY_USED"
        ? "already"
        : result?.code === "UNMARKED"
          ? "unmarked"
          : result?.code === "INVALID_CARD"
            ? "invalid"
            : "warn";

  const icon =
    kind === "success" || kind === "already" ? (
      <CheckCircle2 size={42} />
    ) : kind === "unmarked" ? (
      <Undo2 size={42} />
    ) : kind === "invalid" ? (
      <CreditCard size={42} />
    ) : (
      <AlertTriangle size={42} />
    );

  const frame =
    kind === "success"
      ? "from-brand to-brand-dark"
      : kind === "already"
        ? "from-brand/80 to-shell-2"
        : kind === "unmarked"
          ? "from-muted to-shell-2"
          : kind === "invalid"
            ? "from-danger to-[#7a2a36]"
            : "from-gold to-[#8a5a18]";

  const greeting =
    kind === "success"
      ? "خوش آمدید"
      : kind === "unmarked"
        ? "حضور لغو شد"
        : "وضعیت کارت";

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          key="attendance-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-[min(92vw,28rem)] rounded-[2rem] p-8 text-white text-center bg-linear-to-br ${frame} shadow-2xl overflow-hidden`}
          >
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10 pulse-ring" />
            <div className="relative">
              {result.photoUrl ? (
                <img
                  src={result.photoUrl}
                  alt=""
                  className="mx-auto w-20 h-20 rounded-2xl object-cover mb-4 ring-2 ring-white/40"
                />
              ) : (
                <div className="mx-auto w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mb-4">
                  {icon}
                </div>
              )}
              {result.userName && (
                <p className="text-sm text-white/80 mb-1">{greeting}</p>
              )}
              <h2 className="text-2xl font-bold">
                {result.userName || "کارت ناشناس"}
              </h2>
              <p className="mt-2 text-white/90">{result.message}</p>
              {typeof result.remainingSessions === "number" &&
                typeof result.totalSessions === "number" && (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm">
                    <Clock size={16} />
                    {result.remainingSessions.toLocaleString("fa-IR")} جلسه از{" "}
                    {result.totalSessions.toLocaleString("fa-IR")} باقی مانده
                  </div>
                )}
              <button
                onClick={onClose}
                className="mt-6 px-5 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition"
              >
                بستن
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
