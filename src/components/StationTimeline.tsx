import { useMemo } from "react";
import { Bus } from "lucide-react";
import type { Route, Vehicle, Station } from "@shared/types";
import { calculateETA } from "@/utils/geometry";
import { cn } from "@/lib/utils";

interface StationTimelineProps {
  route: Route;
  vehicles: Vehicle[];
  onStationClick?: (station: Station) => void;
  selectedStationId?: string | null;
  className?: string;
}

export default function StationTimeline({
  route,
  vehicles,
  onStationClick,
  selectedStationId,
  className,
}: StationTimelineProps) {
  const runningVehicles = vehicles.filter(
    (v) => v.routeId === route.id && v.status === "running"
  );

  const stationsWithETA = useMemo(() => {
    return route.stations.map((s, idx) => {
      let minETA: number | null = null;
      let nearestVehicle: Vehicle | null = null;
      runningVehicles.forEach((v) => {
        const eta = calculateETA(route, v.currentStationIndex, v.progress, idx);
        if (eta >= 0 && (minETA === null || eta < minETA)) {
          minETA = eta;
          nearestVehicle = v;
        }
      });
      return { ...s, eta: minETA, vehicle: nearestVehicle };
    });
  }, [route, runningVehicles]);

  const getVehicleAtStation = (stationIndex: number) => {
    return runningVehicles.filter(
      (v) => v.currentStationIndex === stationIndex && v.progress < (stationIndex + 0.5)
    );
  };

  return (
    <div
      className={cn("w-full overflow-x-auto pb-4", className)}
    >
      <div
        className="relative flex items-start min-w-max px-4 py-8"
        style={{ width: `${route.stations.length * 140}px` }}
      >
        <div
          className="absolute left-8 right-8 top-[42px] h-1 rounded-full bg-slate-700/60"
        />

        <div
          className="absolute left-8 top-[42px] h-1 rounded-full transition-all duration-1000"
          style={{
            width: `calc(100% - 64px)`,
            background: `linear-gradient(90deg, ${route.color} 0%, ${route.color} 100%)`,
            opacity: 0.2,
          }}
        />

        {route.stations.map((station, idx) => {
          const withETA = stationsWithETA[idx];
          const vehiclesAtStation = getVehicleAtStation(idx);
          const isSelected = selectedStationId === station.id;
          const isPassed =
            runningVehicles.length > 0 &&
            runningVehicles.some(
              (v) =>
                idx <
                v.currentStationIndex +
                  (v.progress -
                    Math.floor(v.progress * route.stations.length) * 0)
            );

          return (
            <div
              key={station.id}
              className="relative flex flex-col items-center flex-shrink-0"
              style={{ width: 140 }}
            >
              {vehiclesAtStation.length > 0 && (
                <div className="absolute -top-2 flex gap-1">
                  {vehiclesAtStation.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px font-bold text-white animate-float shadow-lg"
                  style={{ backgroundColor: route.color }}
                >
                  <Bus size={12} />
                  到站
                </div>
              ))}
              </div>
              )}

              <button
                onClick={() => onStationClick?.(station)}
                className={cn(
                  "station-node relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all",
                  isPassed
                    ? "bg-slate-600 border-slate-500"
                    : isSelected
                    ? "bg-white border-2 shadow-glow"
                    : "bg-slate-900 border-slate-700 hover:scale-110",
                  onStationClick && "cursor-pointer"
                )}
                style={{
                  backgroundColor: !isPassed && !isSelected ? route.color + "15" : undefined,
                  borderColor: !isPassed && !isSelected ? route.color : undefined,
                  color: isSelected ? route.color : undefined,
                }}
              >
                <span
                  className={cn(
                    "font-display font-bold text-sm",
                    isPassed
                      ? "text-slate-400"
                      : "text-white"
                  )}
                >
                  {idx + 1}
                </span>
              </button>

              <div
                className={cn(
                  "mt-3 text-center px-2",
                  isSelected ? "" : ""
                )}
              >
                <div
                  className={cn(
                    "font-medium text-sm",
                    isPassed ? "text-slate-500" : "text-slate-200"
                  )}
                >
                  {station.name}
                </div>
                {withETA.eta !== null && withETA.eta >= 0 && withETA.eta <= 30 && (
                  <div
                    className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold"
                    style={{
                      backgroundColor:
                        withETA.eta <= 2
                          ? "rgba(244,63,94,0.15)"
                          : withETA.eta <= 5
                          ? "rgba(245,158,11,0.15)"
                          : "rgba(20,184,166,0.15)",
                      color:
                        withETA.eta <= 2
                          ? "#F43F5E"
                          : withETA.eta <= 5
                          ? "#F59E0B"
                          : "#14B8A6",
                    }}
                  >
                    {withETA.eta === 0 ? "即将到达" : `${withETA.eta} 分钟`}
                  </div>
                )}
                {withETA.eta === null && (
                  <div className="mt-1 text-[11px] text-slate-600">暂无车辆</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
