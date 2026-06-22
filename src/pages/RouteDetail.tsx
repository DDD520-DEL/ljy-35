import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Bell,
  MapPin,
  Users,
  Navigation,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ParkMap from "@/components/ParkMap";
import StationTimeline from "@/components/StationTimeline";
import CrowdFeedback from "@/components/CrowdFeedback";
import { useAppStore } from "@/store";
import { useVehicleSimulation } from "@/hooks/useVehicleSimulation";
import { calculateETA, getCrowdColor, getCrowdText, formatDuration } from "@/utils/geometry";
import type { Station, Vehicle } from "@shared/types";
import { cn } from "@/lib/utils";
import { generateUID } from "@/utils/geometry";

export default function RouteDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const routes = useAppStore((s) => s.routes);
  const vehicles = useAppStore((s) => s.vehicles);
  const submitCrowdFeedback = useAppStore((s) => s.submitCrowdFeedback);
  const createReminder = useAppStore((s) => s.createReminder);
  const reminders = useAppStore((s) => s.reminders);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [reminderStationOpen, setReminderStationOpen] = useState(false);
  useVehicleSimulation();

  const route = routes.find((r) => r.id === id);
  const routeVehicles = useMemo(
    () => vehicles.filter((v) => v.routeId === id),
    [vehicles, id]
  );
  const runningVehicles = routeVehicles.filter((v) => v.status === "running");

  const nearestToSelectedStation = useMemo(() => {
    if (!route || !selectedStationId) return null;
    const stationIdx = route.stations.findIndex((s) => s.id === selectedStationId);
    let best: { vehicle: Vehicle; eta: number } | null = null;
    runningVehicles.forEach((v) => {
      const eta = calculateETA(route, v.currentStationIndex, v.progress, stationIdx);
      if (eta >= 0 && (best === null || eta < best.eta)) {
        best = { vehicle: v, eta };
      }
    });
    return best;
  }, [route, selectedStationId, runningVehicles]);

  const selectedVehicle = useMemo(
    () => routeVehicles.find((v) => v.id === selectedVehicleId) ?? runningVehicles[0] ?? null,
    [routeVehicles, selectedVehicleId, runningVehicles]
  );

  const activeReminders = reminders.filter(
    (r) => r.routeId === id && !r.notified
  );

  if (!route) {
    return (
      <div className="flex min-h-screen bg-bg">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl text-white mb-3">线路未找到</h2>
            <button
              onClick={() => navigate("/passenger")}
              className="px-4 py-2 rounded-lg bg-sky-500/20 text-sky-400"
            >
              返回列表
            </button>
          </div>
        </main>
      </div>
    );
  }

  const handleStationClick = (station: Station) => {
    setSelectedStationId(station.id);
  };

  const handleCreateReminder = (stationId: string) => {
    if (!nearestToSelectedStation) return;
    const existing = reminders.find(
      (r) => r.stationId === stationId && r.vehicleId === nearestToSelectedStation.vehicle.id && !r.notified
    );
    if (existing) {
      return;
    }
    createReminder({
      routeId: route.id,
      vehicleId: nearestToSelectedStation.vehicle.id,
      stationId,
    });
    setSelectedStationId(stationId);
  };

  const totalRunTime = selectedVehicle?.startTimestamp
    ? Math.floor((Date.now() - selectedVehicle.startTimestamp) / 1000)
    : 0;

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />

      <main className="flex-1 overflow-y-auto min-h-screen">
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
          <div className="flex items-center gap-4 animate-fade-in-up">
            <button
              onClick={() => navigate("/passenger")}
              className="p-2.5 rounded-xl border border-slate-700/40 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-4 h-4 rounded-full shadow-glow"
                  style={{ backgroundColor: route.color }}
                />
                <h1 className="font-display font-bold text-3xl text-white tracking-tight">
                  {route.name}
                </h1>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: `${route.color}20`, color: route.color }}
                >
                  {route.shortName}
                </span>
              </div>
              <p className="text-slate-400 ml-7 text-sm">
                {route.description} · {route.operatingHours} · 发车间隔 {route.interval} 分钟
              </p>
            </div>
            <div className="flex items-center gap-4 px-5 py-3 rounded-xl glass border border-slate-700/40">
              <div className="text-center">
                <div className="font-mono font-bold text-2xl text-white count-number">
                  {runningVehicles.length}
                </div>
                <div className="text-[11px] text-slate-500 uppercase">运行中</div>
              </div>
              <div className="w-px h-10 bg-slate-700" />
              <div className="text-center">
                <div className="font-mono font-bold text-2xl text-white count-number">
                  {route.stations.length}
                </div>
                <div className="text-[11px] text-slate-500 uppercase">站点</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <div className="col-span-12 xl:col-span-8 space-y-6">
              <ParkMap
                routes={[route]}
                vehicles={vehicles}
                highlightRouteId={route.id}
                className="h-[460px]"
              />

              <div className="p-6 rounded-2xl glass border border-slate-700/40">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Navigation size={18} className="text-slate-400" />
                    <h3 className="font-display font-semibold text-white text-lg">
                      站点时间轴
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    点击站点查看ETA或设置提醒
                  </span>
                </div>
                <StationTimeline
                  route={route}
                  vehicles={vehicles}
                  onStationClick={handleStationClick}
                  selectedStationId={selectedStationId}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl glass border border-slate-700/40 relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 w-full h-1"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${route.color}66, transparent)`,
                    }}
                  />
                  <div className="flex items-center gap-2 mb-3">
                    <Bell size={18} className="text-sky-400" />
                    <h3 className="font-display font-semibold text-white">到站提醒</h3>
                  </div>

                  {activeReminders.length > 0 ? (
                    <div className="space-y-2 mt-4">
                      {activeReminders.map((r) => {
                        const st = route.stations.find((s) => s.id === r.stationId);
                        return (
                          <div
                            key={r.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20"
                          >
                            <CheckCircle2 size={16} className="text-sky-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">
                                即将到达 <span className="font-semibold">{st?.name}</span>
                              </p>
                              <p className="text-xs text-slate-400">
                                正在监听班车位置
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="relative mt-4">
                      <button
                        onClick={() => setReminderStationOpen(!reminderStationOpen)}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/60 border border-slate-700/40 text-left text-sm text-slate-300 hover:bg-slate-800 transition-all"
                      >
                        <span>
                          {selectedStationId
                            ? route.stations.find((s) => s.id === selectedStationId)?.name
                            : "选择目标站点..."}
                        </span>
                        <ChevronDown
                          size={16}
                          className={cn("transition-transform", reminderStationOpen && "rotate-180")}
                        />
                      </button>
                      {reminderStationOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-xl bg-slate-900/95 border border-slate-700/40 z-10 max-h-60 overflow-y-auto">
                          {route.stations.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => {
                                setSelectedStationId(s.id);
                                setReminderStationOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all",
                                selectedStationId === s.id
                                  ? "bg-sky-500/20 text-sky-300"
                                  : "text-slate-300 hover:bg-slate-800"
                              )}
                            >
                              <span className="font-mono text-xs text-slate-500 mr-2">
                                S{s.index + 1}
                              </span>
                              {s.name}
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedStationId && (
                        <button
                          onClick={() => handleCreateReminder(selectedStationId)}
                          className="btn-primary w-full mt-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-sky-500 to-cyan-500 hover:shadow-glow transition-all"
                        >
                          开启到站提醒
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-2xl glass border border-slate-700/40">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={18} className="text-violet-400" />
                    <h3 className="font-display font-semibold text-white">最近一班 ETA</h3>
                  </div>

                  {nearestToSelectedStation && selectedStationId ? (
                    <div className="space-y-4">
                      <div
                        className="text-center p-5 rounded-xl"
                        style={{
                          background: `linear-gradient(135deg, ${route.color}22, transparent)`,
                        }}
                      >
                        <div className="text-xs text-slate-400 mb-2">
                          距离 {route.stations.find((s) => s.id === selectedStationId)?.name}
                        </div>
                        <div className="font-mono font-bold text-6xl text-white count-number">
                          {nearestToSelectedStation.eta}
                          <span className="text-2xl font-normal text-slate-400 ml-1">分</span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          车牌号：{nearestToSelectedStation.vehicle.plateNumber}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-lg bg-slate-800/50">
                          <div className="font-mono text-sm text-white">
                            {nearestToSelectedStation.vehicle.currentStationIndex}
                            <span className="text-slate-500">/{route.stations.length - 1}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">当前站</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-800/50">
                          <div className="font-mono text-sm text-white">
                            {Math.round(nearestToSelectedStation.vehicle.progress * 100)}%
                          </div>
                          <div className="text-[10px] text-slate-500">线路进度</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-800/50">
                          <div className="font-mono text-sm text-white">
                            {nearestToSelectedStation.vehicle.speed}<span className="text-slate-500 text-xs">km/h</span>
                          </div>
                          <div className="text-[10px] text-slate-500">车速</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500">
                      <MapPin size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm">请在上方时间轴选择目标站点</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-12 xl:col-span-4 space-y-6">
              <div className="p-6 rounded-2xl glass border border-slate-700/40">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-slate-400" />
                    <h3 className="font-display font-semibold text-white">运行车辆</h3>
                  </div>
                  <span className="text-xs text-slate-500">{runningVehicles.length} 辆</span>
                </div>

                <div className="space-y-3">
                  {runningVehicles.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      当前无运行车辆
                    </div>
                  ) : (
                    runningVehicles.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVehicleId(v.id)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all",
                          selectedVehicle?.id === v.id
                            ? "border-sky-500/50 bg-sky-500/10"
                            : "border-slate-700/40 bg-slate-900/50 hover:bg-slate-800/60"
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: `${route.color}22` }}
                            >
                              <span
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{ backgroundColor: route.color }}
                              />
                            </div>
                            <div>
                              <div className="font-mono font-semibold text-white text-sm">
                                {v.plateNumber}
                              </div>
                              <div className="text-xs text-slate-400">{v.driverName}</div>
                            </div>
                          </div>
                          <span
                            className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                            style={{
                              backgroundColor: `${getCrowdColor(v.crowdLevel)}18`,
                              color: getCrowdColor(v.crowdLevel),
                            }}
                          >
                            {getCrowdText(v.crowdLevel)}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">
                              第 {v.currentStationIndex + 1} 站：
                              {route.stations[v.currentStationIndex]?.name}
                            </span>
                            <span className="text-slate-400 font-mono">
                              {formatDuration(totalRunTime)}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full timeline-fill"
                              style={{
                                width: `${v.progress * 100}%`,
                                backgroundColor: route.color,
                                boxShadow: `0 0 8px ${route.color}80`,
                              }}
                            />
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {selectedVehicle && (
                <div className="p-6 rounded-2xl glass border border-slate-700/40 animate-slide-in">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${route.color}22` }}
                    >
                      <span className="text-xs font-bold" style={{ color: route.color }}>
                        {selectedVehicle.plateNumber.slice(-4)}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-white">拥挤度反馈</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 ml-10">
                    您正在乘坐此班车？帮助我们更新实时拥挤度
                  </p>
                  <CrowdFeedback
                    vehicle={selectedVehicle}
                    onSubmit={submitCrowdFeedback}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
