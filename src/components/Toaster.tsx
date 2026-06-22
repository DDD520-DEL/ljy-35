import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

const iconMap = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const colorMap = {
  success: "border-emerald-500/40 from-emerald-500/15",
  info: "border-sky-500/40 from-sky-500/15",
  warning: "border-amber-500/40 from-amber-500/15",
  error: "border-rose-500/40 from-rose-500/15",
};

const iconColor = {
  success: "text-emerald-400",
  info: "text-sky-400",
  warning: "text-amber-400",
  error: "text-rose-400",
};

export default function Toaster() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const Icon = iconMap[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "toast-enter pointer-events-auto p-4 pr-10 rounded-xl border backdrop-blur-md bg-gradient-to-br",
              colorMap[t.type],
              "to-slate-900/90 shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
            )}
          >
            <div className="flex items-start gap-3">
              <Icon size={20} className={cn("flex-shrink-0 mt-0.5", iconColor[t.type])} />
              <p className="text-sm text-slate-100 leading-relaxed">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white transition-colors p-1"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
