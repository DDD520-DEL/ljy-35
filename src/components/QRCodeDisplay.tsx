import { useState, useEffect, useMemo } from "react";
import { RefreshCw, Users, MapPin, Clock, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface QRCodeDisplayProps {
  qrData: string;
  token: string;
  routeName: string;
  stationName: string;
  passengerCount: number;
  expiresAt: number;
  onRefresh: () => void;
  size?: number;
  className?: string;
}

export default function QRCodeDisplay({
  qrData,
  token,
  routeName,
  stationName,
  passengerCount,
  expiresAt,
  onRefresh,
  size = 240,
  className,
}: QRCodeDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const updateTimeLeft = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 5) {
        onRefresh();
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onRefresh]);

  const qrPattern = useMemo(() => {
    const size = 21;
    const pattern: boolean[][] = [];
    const seed = qrData.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

    for (let i = 0; i < size; i++) {
      pattern[i] = [];
      for (let j = 0; j < size; j++) {
        const isFinder =
          (i < 7 && j < 7) ||
          (i < 7 && j >= size - 7) ||
          (i >= size - 7 && j < 7);

        if (isFinder) {
          const fi = i < 7 ? i : size - 1 - i;
          const fj = j < 7 ? j : size - 1 - j;
          pattern[i][j] =
            fi === 0 || fi === 6 || fj === 0 || fj === 6 ||
            (fi >= 2 && fi <= 4 && fj >= 2 && fj <= 4);
        } else {
          const hash = ((seed * (i + 1) * (j + 1)) % 100) > 45;
          pattern[i][j] = hash;
        }
      }
    }
    return pattern;
  }, [qrData]);

  const cellSize = size / 21;

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      void _err;
    }
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="relative p-4 bg-white rounded-2xl shadow-lg"
        style={{ width: size + 32, height: size + 32 }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute top-4 left-4"
        >
          {qrPattern.map((row, i) =>
            row.map((cell, j) =>
              cell ? (
                <rect
                  key={`${i}-${j}`}
                  x={j * cellSize}
                  y={i * cellSize}
                  width={cellSize + 0.5}
                  height={cellSize + 0.5}
                  fill="#0f172a"
                  rx={1}
                />
              ) : null
            )
          )}
        </svg>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">BUS</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 w-full space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-sky-400" />
            <span className="text-xs text-slate-400">当前站点</span>
          </div>
          <span className="text-sm font-medium text-white">{stationName}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-emerald-400" />
            <span className="text-xs text-slate-400">当前乘客</span>
          </div>
          <span className="text-sm font-medium text-white">{passengerCount} 人</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-amber-400" />
            <span className="text-xs text-slate-400">二维码有效期</span>
          </div>
          <span
            className={cn(
              "text-sm font-mono font-bold",
              timeLeft <= 10 ? "text-rose-400" : "text-emerald-400"
            )}
          >
            {timeLeft}s
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">线路</span>
            <span className="text-sm font-medium text-white">{routeName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">签到 Token</span>
            <button
              onClick={handleCopyToken}
              className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "已复制" : "复制"}
            </button>
          </div>
          <div className="mt-1 font-mono text-xs text-slate-500 truncate">{token}</div>
        </div>

        <button
          onClick={onRefresh}
          className="w-full py-3 rounded-xl font-medium text-white bg-gradient-to-r from-sky-500 to-blue-500 hover:shadow-[0_0_24px_rgba(14,165,233,0.4)] transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} />
          刷新二维码
        </button>
      </div>
    </div>
  );
}
