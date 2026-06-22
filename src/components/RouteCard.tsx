import { useNavigate } from "react-router-dom";
import { Bus, Clock, Users, ChevronRight, Navigation } from "lucide-react";
import type { Route, Vehicle } from "@shared/types";
import { getCrowdColor, getCrowdText, calculateETA } from "@/utils/geometry";
import { cn } from "@/lib/utils";

interface RouteCardProps {
  route: Route;
  vehicles: Vehicle[];
  className?: string;
}

export default function RouteCard({ route, vehicles, className }: RouteCardProps) {
  const navigate = useNavigate();
  const runningVehicles = vehicles.filter(
    (v) => v.routeId === route.id && v.status === "running"
  );
  const idleVehicles = vehicles.filter((v) => v.routeId === route.id);

  const nearestVehicle =
    runningVehicles.length > 0
      ? runningVehicles.reduce(
          (nearest, v) =>
            v.progress > nearest.progress && v.progress < 0.9 ? v : nearest,
          runningVehicles[0]
        )
      : null;

  const nextETA = nearestVehicle
    ? calculateETA(
        route,
        nearestVehicle.currentStationIndex,
        nearestVehicle.progress,
        nearestVehicle.currentStationIndex + 1 < route.stations.length - 1
          ? nearestVehicle.currentStationIndex + 1
          : 0
      )
    : null;

  const avgCrowd: "loose" | "normal" | "crowded" | null =
    runningVehicles.length > 0
      ? (() => {
          const counts = runningVehicles.map((v) => v.crowdLevel);
          const countL = counts.filter((c) => c === "loose").length;
          const countC = counts.filter((c) => c === "crowded").length;
          if (countL >= countC && countL > runningVehicles.length / 2) return "loose";
          if (countC > countL && countC > runningVehicles.length / 2) return "crowded";
          return "normal";
        })()
      : null;

  return (
    <div
      onClick={() => navigate(`/passenger/route/${route.id}`)}
      className={cn(
        "relative p-5 rounded-2xl border border-slate-700/40 cursor-pointer transition-all glass glass-hover",
        className
      )}
    >
      <div
        className="absolute left-0 top-5 bottom-5 w-1 rounded-r-full"
        style={{ backgroundColor: route.color, boxShadow: `0 0 12px ${route.color}55` }}
      />

      <div className="pl-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${route.color}20` }}
            >
              <Bus size={22} style={{ color: route.color }} />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg">{route.name}</h3>
              <p className="text-xs text-slate-400">{route.description}</p>
            </div>
          </div>
          <ChevronRight
            size={20}
            className="text-slate-500 group-hover:text-white transition-colors"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/30">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Bus size={13} />
              运行中
            </div>
            <div className="font-mono font-bold text-xl text-white">
              {runningVehicles.length}
              <span className="text-sm font-normal text-slate-400">/{idleVehicles.length}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/30">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Clock size={13} />
              下一班
            </div>
            <div className="font-mono font-bold text-xl text-white">
              {nextETA !== null ? `${nextETA}` : "--"}
              <span className="text-sm font-normal text-slate-400">分</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/30">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Navigation size={13} />
              站点数
            </div>
            <div className="font-mono font-bold text-xl text-white">
              {route.stations.length}
              <span className="text-sm font-normal text-slate-400">站</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-500" />
            <span className="text-sm text-slate-400">
              运营时间 <span className="text-slate-300">{route.operatingHours}</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-sm text-slate-400">
              间隔 <span className="text-slate-300">{route.interval}分</span>
            </span>
          </div>
          {avgCrowd && (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${getCrowdColor(avgCrowd)}18`,
                color: getCrowdColor(avgCrowd),
              }}
            >
              <Users size={13} />
              {getCrowdText(avgCrowd)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
