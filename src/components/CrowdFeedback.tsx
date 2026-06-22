import { useState } from "react";
import { Users } from "lucide-react";
import type { CrowdLevel, Vehicle } from "@shared/types";
import { cn } from "@/lib/utils";

interface CrowdFeedbackProps {
  vehicle: Vehicle;
  onSubmit: (vehicleId: string, level: CrowdLevel) => void;
  compact?: boolean;
  className?: string;
}

const options: { level: CrowdLevel; label: string; desc: string; color: string; bg: string }[] = [
  {
    level: "loose",
    label: "宽松",
    desc: "座位充足",
    color: "#10B981",
    bg: "from-emerald-500/10 hover:from-emerald-500/20",
  },
  {
    level: "normal",
    label: "适中",
    desc: "有少量站位",
    color: "#F59E0B",
    bg: "from-amber-500/10 hover:from-amber-500/20",
  },
  {
    level: "crowded",
    label: "拥挤",
    desc: "人员密集",
    color: "#F43F5E",
    bg: "from-rose-500/10 hover:from-rose-500/20",
  },
];

export default function CrowdFeedback({
  vehicle,
  onSubmit,
  compact = false,
  className,
}: CrowdFeedbackProps) {
  const [selected, setSelected] = useState<CrowdLevel | null>(null);
  const totalVotes =
    vehicle.crowdVotes.loose + vehicle.crowdVotes.normal + vehicle.crowdVotes.crowded;

  const handleSubmit = (level: CrowdLevel) => {
    setSelected(level);
    onSubmit(vehicle.id, level);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-slate-400" />
          <span className="font-medium text-slate-200">
            {compact ? "拥挤度反馈" : "车内拥挤度"}
          </span>
        </div>
        <span className="text-xs text-slate-500">共 {totalVotes} 人反馈</span>
      </div>

      <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-3")}>
        {options.map((opt) => {
          const count = vehicle.crowdVotes[opt.level];
          const percent = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
          const isActive = vehicle.crowdLevel === opt.level || selected === opt.level;
          const isSelected = selected === opt.level;
          return (
            <button
              key={opt.level}
              onClick={() => handleSubmit(opt.level)}
              className={cn(
                "relative group p-3 rounded-xl border transition-all overflow-hidden",
                "bg-gradient-to-br",
                opt.bg,
                isActive ? "scale-[1.02]" : "border-transparent hover:border-slate-600/40",
                "hover:scale-[1.01]"
              )}
              style={{
                borderColor: isActive ? opt.color + "60" : undefined,
                boxShadow: isActive ? `0 0 20px ${opt.color}25` : undefined,
              }}
            >
              <div
                className="absolute left-0 bottom-0 h-1 transition-all duration-500 rounded-tr-lg"
                style={{ width: `${percent}%`, backgroundColor: opt.color, opacity: 0.6 }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="font-display font-bold text-base"
                    style={{ color: opt.color }}
                  >
                    {opt.label}
                  </span>
                  <span className="text-xs text-slate-400">{Math.round(percent)}%</span>
                </div>
                <div className="text-xs text-slate-400">{opt.desc}</div>
                <div className="mt-2 text-xs font-mono text-slate-500">{count} 票</div>
              </div>
              {isSelected && (
                <div
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: opt.color }}
                >
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
