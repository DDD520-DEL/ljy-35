import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Play,
  Square,
  CarFront,
  MapPin,
  Clock,
  Navigation,
  Power,
  Wifi,
  WifiOff,
  Gauge,
  Thermometer,
  ChevronDown,
  QrCode,
  Users,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { useAppStore } from "@/store";
import { formatDuration, getPositionOnPath } from "@/utils/geometry";
import { cn } from "@/lib/utils";
import type { Route } from "@shared/types";

export default function DriverConsole() {
  const routes = useAppStore((s) => s.routes);
  const vehicles = useAppStore((s) => s.vehicles);
  const updateVehicleStatus = useAppStore((s) => s.updateVehicleStatus);
  const updateVehicleProgress = useAppStore((s) => s.updateVehicleProgress);
  const driverVehicleId = useAppStore((s) => s.driverVehicleId);
  const setDriverVehicleId = useAppStore((s) => s.setDriverVehicleId);
  const addToast = useAppStore((s) => s.addToast);
  const qrCodeData = useAppStore((s) => s.qrCodeData);
  const generateQRCode = useAppStore((s) => s.generateQRCode);
  const refreshQRCode = useAppStore((s) => s.refreshQRCode);
  const clearQRCode = useAppStore((s) => s.clearQRCode);

  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id ?? "");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    driverVehicleId ?? vehicles.filter((v) => v.routeId === routes[0]?.id)[0]?.id ?? ""
  );
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const route = routes.find((r) => r.id === selectedRouteId) as Route;
  const routeVehicles = useMemo(
    () => vehicles.filter((v) => v.routeId === selectedRouteId),
    [vehicles, selectedRouteId]
  );
  const vehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;

  useEffect(() => {
    if (!isRunning || !vehicle || !route) return;

    const interval = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, selectedVehicleId]);

  useEffect(() => {
    if (!isRunning || !vehicle || !route) return;

    let progress = vehicle.progress;
    let stationIndex = vehicle.currentStationIndex;
    const totalStations = route.stations.length;
    const stationInterval = 250;

    const interval = window.setInterval(() => {
      progress = Math.min(1, progress + 0.004);
      const totalSegments = totalStations - 1;
      const newStationIndex = Math.min(
        totalSegments,
        Math.floor(progress * totalSegments)
      );

      if (newStationIndex !== stationIndex) {
        stationIndex = newStationIndex;
        const newStationId = route.stations[stationIndex]?.id;
        if (newStationId) {
          void generateQRCode(vehicle.id, newStationId);
          addToast({
            type: "info",
            message: `到达 ${route.stations[stationIndex]?.name ?? "下一站"}，签到码已更新`,
            duration: 2500,
          });
        }
      }

      const position = getPositionOnPath(route.pathPoints, progress);
      updateVehicleProgress(vehicle.id, progress, position, stationIndex);

      if (stationIndex >= totalStations - 1 && progress >= 0.999) {
        stopDriving(true);
      }
    }, stationInterval);

    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, selectedVehicleId]);

  useEffect(() => {
    const first = routeVehicles.find((v) => v.status === "idle") ?? routeVehicles[0];
    if (first && selectedVehicleId !== first.id) {
      setSelectedVehicleId(first.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRouteId]);

  const startDriving = () => {
    if (!vehicle || !route) return;
    updateVehicleStatus(vehicle.id, "running", Date.now());
    updateVehicleProgress(vehicle.id, 0, route.pathPoints[0], 0);
    setDriverVehicleId(vehicle.id);
    setIsRunning(true);
    setElapsedSeconds(0);

    const firstStationId = route.stations[0]?.id;
    if (firstStationId) {
      void generateQRCode(vehicle.id, firstStationId);
    }

    addToast({
      type: "success",
      message: `GPS 已开启 · ${route.name} 班车开始运行`,
      duration: 3000,
    });
  };

  const stopDriving = (completed = false) => {
    if (!vehicle) return;
    updateVehicleStatus(vehicle.id, "idle");
    setIsRunning(false);
    clearQRCode();
    addToast({
      type: completed ? "success" : "info",
      message: completed
        ? `🎉 行程完成！已运行 ${formatDuration(elapsedSeconds)}`
        : "GPS 上报已停止",
      duration: 3500,
    });
  };

  const handleRefreshQRCode = useCallback(() => {
    void refreshQRCode();
  }, [refreshQRCode]);

  const totalStations = route?.stations.length ?? 0;
  const currentStationName = route?.stations[vehicle?.currentStationIndex ?? 0]?.name ?? "--";
  const nextStationName =
    route?.stations[Math.min(totalStations - 1, (vehicle?.currentStationIndex ?? 0) + 1)]?.name ??
    "终点站";

  const progressPct = Math.round((vehicle?.progress ?? 0) * 100);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />

      <main className="flex-1 overflow-y-auto min-h-screen">
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
          <div className="flex items-center justify-between animate-fade-in-up">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display font-bold text-3xl text-white tracking-tight">
                  司机控制台
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                    isRunning
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 animate-pulse"
                      : "bg-slate-700/40 text-slate-400 border border-slate-600/40"
                  )}
                >
                  {isRunning ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {isRunning ? "GPS 上报中" : "空闲"}
                </span>
              </div>
              <p className="text-slate-400">选择线路与班次，开启GPS自动上报</p>
            </div>

            <div className="flex items-center gap-4 px-6 py-4 rounded-2xl glass border border-slate-700/40">
              <div className="text-center">
                <div className="font-mono font-bold text-3xl text-white count-number">
                  {formatDuration(elapsedSeconds)}
                </div>
                <div className="text-[11px] text-slate-500 uppercase">已运行</div>
              </div>
              <div className="w-px h-12 bg-slate-700" />
              <div className="text-center">
                <div className="font-mono font-bold text-3xl text-white count-number">
                  {vehicle?.speed ?? 0}
                  <span className="text-sm font-normal text-slate-500"> km/h</span>
                </div>
                <div className="text-[11px] text-slate-500 uppercase">车速</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="p-6 rounded-2xl glass border border-slate-700/40">
                <div className="flex items-center gap-2 mb-5">
                  <CarFront size={18} className="text-emerald-400" />
                  <h3 className="font-display font-semibold text-white">线路与班次</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">选择线路</label>
                    <div className="space-y-2">
                      {routes.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setSelectedRouteId(r.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                            selectedRouteId === r.id
                              ? "border-sky-500/50 bg-sky-500/10"
                              : "border-slate-700/40 bg-slate-900/50 hover:bg-slate-800/60"
                          )}
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${r.color}22` }}
                          >
                            <span
                              className="w-3 h-3 rounded-full shadow-glow"
                              style={{ backgroundColor: r.color }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-sm">{r.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {r.stations.length} 站 · {r.operatingHours}
                            </div>
                          </div>
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                            style={{ backgroundColor: `${r.color}22`, color: r.color }}
                          >
                            {r.shortName}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {routeVehicles.length > 0 && (
                    <div>
                      <label className="text-xs text-slate-400 mb-2 block">选择车辆</label>
                      <div className="relative">
                        <button
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-700/40 bg-slate-900/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                              <CarFront size={14} className="text-slate-400" />
                            </div>
                            <div className="text-left">
                              <div className="font-mono font-semibold text-sm text-white">
                                {vehicle?.plateNumber ?? "--"}
                              </div>
                              <div className="text-xs text-slate-400">
                                {vehicle?.driverName ?? "--"}
                              </div>
                            </div>
                          </div>
                          <ChevronDown
                            size={16}
                            className={cn(
                              "text-slate-400 transition-transform",
                              dropdownOpen && "rotate-180"
                            )}
                          />
                        </button>

                        {dropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-xl bg-slate-900/95 border border-slate-700/40 z-20 space-y-1">
                            {routeVehicles.map((v) => (
                              <button
                                key={v.id}
                                onClick={() => {
                                  setSelectedVehicleId(v.id);
                                  setDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left p-3 rounded-lg transition-all",
                                  v.id === selectedVehicleId
                                    ? "bg-sky-500/20 text-sky-200"
                                    : "text-slate-300 hover:bg-slate-800"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-sm">{v.plateNumber}</span>
                                  <span
                                    className={cn(
                                      "text-[10px] px-2 py-0.5 rounded-full",
                                      v.status === "running"
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-slate-700 text-slate-400"
                                    )}
                                  >
                                    {v.status === "running" ? "运行中" : "空闲"}
                                  </span>
                                </div>
                                <div className="text-xs mt-0.5 opacity-70">{v.driverName}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-2xl glass border border-slate-700/40 relative overflow-hidden">
                {isRunning && (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
                )}
                <div className="relative">
                  <div className="flex items-center gap-2 mb-6">
                    <Power size={18} className={isRunning ? "text-emerald-400" : "text-slate-400"} />
                    <h3 className="font-display font-semibold text-white">GPS 上报控制</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="aspect-square rounded-2xl border border-slate-700/40 flex flex-col items-center justify-center relative overflow-hidden">
                      <Gauge
                        size={34}
                        className={cn("mb-2", isRunning ? "text-emerald-400" : "text-slate-600")}
                      />
                      <span className="text-xs text-slate-400">定位信号</span>
                      <span
                        className={cn(
                          "mt-0.5 text-sm font-bold",
                          isRunning ? "text-emerald-400" : "text-slate-500"
                        )}
                      >
                        {isRunning ? "良好" : "离线"}
                      </span>
                      {isRunning && (
                        <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-glow-teal" />
                      )}
                    </div>
                    <div className="aspect-square rounded-2xl border border-slate-700/40 flex flex-col items-center justify-center">
                      <Thermometer
                        size={34}
                        className={cn("mb-2", isRunning ? "text-amber-400" : "text-slate-600")}
                      />
                      <span className="text-xs text-slate-400">车辆状态</span>
                      <span
                        className={cn(
                          "mt-0.5 text-sm font-bold",
                          isRunning ? "text-amber-400" : "text-slate-500"
                        )}
                      >
                        {isRunning ? "运行" : "熄火"}
                      </span>
                    </div>
                  </div>

                  {!isRunning ? (
                    <button
                      onClick={startDriving}
                      disabled={!vehicle || vehicle.status === "running"}
                      className="btn-primary w-full py-4 rounded-2xl font-display font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-glow-teal transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Play size={20} />
                      开始运行 / GPS 上报
                    </button>
                  ) : (
                    <button
                      onClick={() => stopDriving(false)}
                      className="btn-primary w-full py-4 rounded-2xl font-display font-semibold text-white bg-gradient-to-r from-rose-500 to-red-500 hover:shadow-glow-rose transition-all flex items-center justify-center gap-2"
                    >
                      <Square size={20} />
                      停止运行
                    </button>
                  )}
                </div>
              </div>

              {isRunning && qrCodeData && (
                <div className="p-6 rounded-2xl glass border border-slate-700/40 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-transparent pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-5">
                      <QrCode size={18} className="text-sky-400" />
                      <h3 className="font-display font-semibold text-white">乘客签到二维码</h3>
                    </div>

                    <div className="flex justify-center">
                      <QRCodeDisplay
                        qrData={qrCodeData.qrData}
                        token={qrCodeData.token}
                        routeName={qrCodeData.routeName}
                        stationName={qrCodeData.stationName}
                        passengerCount={qrCodeData.passengerCount}
                        expiresAt={qrCodeData.expiresAt}
                        onRefresh={handleRefreshQRCode}
                        size={200}
                      />
                    </div>
                  </div>
                </div>
              )}

              {isRunning && (
                <div className="p-6 rounded-2xl glass border border-slate-700/40">
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={18} className="text-emerald-400" />
                    <h3 className="font-display font-semibold text-white">本班次签到</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-white count-number">
                        {qrCodeData?.passengerCount ?? 0}
                      </div>
                      <div className="text-xs text-slate-500">已签到乘客</div>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <Users size={28} className="text-emerald-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    icon: Navigation,
                    label: "当前站点",
                    value: currentStationName,
                    color: "text-sky-400",
                    bg: "from-sky-500/15",
                  },
                  {
                    icon: MapPin,
                    label: "下一站",
                    value: nextStationName,
                    color: "text-violet-400",
                    bg: "from-violet-500/15",
                  },
                  {
                    icon: Clock,
                    label: "线路进度",
                    value: `${progressPct}%`,
                    color: "text-emerald-400",
                    bg: "from-emerald-500/15",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={cn(
                      "p-5 rounded-2xl glass border border-slate-700/40 bg-gradient-to-br",
                      s.bg,
                      "to-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <s.icon size={16} className={s.color} />
                      <span className="text-xs text-slate-400">{s.label}</span>
                    </div>
                    <div className="font-display font-bold text-2xl text-white count-number truncate">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-2xl glass border border-slate-700/40">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-sky-400" />
                    <h3 className="font-display font-semibold text-white text-lg">运行路线</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    STN {(vehicle?.currentStationIndex ?? 0) + 1} / {totalStations}
                  </span>
                </div>

                <div className="relative mb-6">
                  <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-slate-700/60 rounded-full" />
                  <div
                    className="absolute left-3.5 top-0 w-0.5 bg-gradient-to-b rounded-full transition-all duration-1000"
                    style={{
                      height: `${progressPct}%`,
                      backgroundColor: route?.color ?? "#0EA5E9",
                      boxShadow: `0 0 12px ${route?.color ?? "#0EA5E9"}80`,
                    }}
                  />

                  <div className="space-y-4 pl-10">
                    {route?.stations.map((station, idx) => {
                      const isCurrent = idx === vehicle?.currentStationIndex;
                      const isPassed = idx < (vehicle?.currentStationIndex ?? 0);
                      return (
                        <div key={station.id} className="relative">
                          <span
                            className={cn(
                              "absolute -left-[30px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                              isCurrent
                                ? "bg-white border-white shadow-glow"
                                : isPassed
                                ? "border-emerald-400 bg-emerald-400"
                                : "border-slate-600 bg-slate-900"
                            )}
                            style={
                              isCurrent
                                ? {
                                    backgroundColor: route.color,
                                    borderColor: route.color,
                                    boxShadow: `0 0 16px ${route.color}AA`,
                                  }
                                : undefined
                            }
                          >
                            {isPassed && (
                              <span className="w-2 h-2 rounded-full bg-slate-900" />
                            )}
                            {isCurrent && (
                              <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
                            )}
                          </span>
                          <div
                            className={cn(
                              "p-4 rounded-xl border transition-all",
                              isCurrent
                                ? "border-sky-500/40 bg-sky-500/10"
                                : isPassed
                                ? "border-slate-700/30 bg-slate-900/30 opacity-60"
                                : "border-slate-700/40 bg-slate-900/50"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-xs text-slate-500">
                                  S{idx + 1}
                                </span>
                                <span
                                  className={cn(
                                    "font-medium",
                                    isCurrent ? "text-white" : "text-slate-300"
                                  )}
                                >
                                  {station.name}
                                </span>
                              </div>
                              <span
                                className={cn(
                                  "text-xs",
                                  isCurrent
                                    ? "text-sky-400 font-semibold"
                                    : isPassed
                                    ? "text-emerald-500"
                                    : "text-slate-500"
                                )}
                              >
                                {isCurrent
                                  ? "● 当前站"
                                  : isPassed
                                  ? "✓ 已通过"
                                  : "待到达"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl glass border border-slate-700/40">
                <div className="text-xs text-slate-500 mb-3 font-mono uppercase">实时位置模拟</div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full timeline-fill relative"
                    style={{
                      width: `${progressPct}%`,
                      background: `linear-gradient(90deg, ${route?.color ?? "#0EA5E9"}88, ${route?.color ?? "#0EA5E9"})`,
                    }}
                  >
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-glow" />
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-mono">
                  <span>起点</span>
                  <span>{progressPct}% 完成</span>
                  <span>终点</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
