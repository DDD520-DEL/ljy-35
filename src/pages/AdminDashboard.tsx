import { useState, useMemo } from "react";
import { TrendingUp, BarChart3, History, Calendar, Activity, Users } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ParkMap from "@/components/ParkMap";
import StatsCharts from "@/components/StatsCharts";
import { useAppStore } from "@/store";
import { useVehicleSimulation } from "@/hooks/useVehicleSimulation";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const routes = useAppStore((s) => s.routes);
  const vehicles = useAppStore((s) => s.vehicles);
  const punctuality = useAppStore((s) => s.punctualityStats);
  const [tab, setTab] = useState<"stats" | "trajectory">("stats");
  const [trajectoryRouteId, setTrajectoryRouteId] = useState<string>(routes[0]?.id ?? "");
  const [trajectoryDate, setTrajectoryDate] = useState("2024-01-15");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  useVehicleSimulation();

  const trajectoryRoute = routes.find((r) => r.id === trajectoryRouteId);
  const routeVehicles = vehicles.filter((v) => v.routeId === trajectoryRouteId);

  const trajectoryVehicles = useMemo(() => {
    return routeVehicles.map((v, i) => {
      let prog = playbackProgress + i * 0.15;
      if (prog > 1) prog = prog - 1;
      return { ...v, progress: prog };
    });
  }, [playbackProgress, routeVehicles]);

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    const start = Date.now();
    const duration = 30000 / playbackSpeed;
    const animate = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      setPlaybackProgress(p);
      if (p < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
      }
    };
    requestAnimationFrame(animate);
  };

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />

      <main className="flex-1 overflow-y-auto min-h-screen">
        <div className="p-8 max-w-[1500px] mx-auto space-y-6">
          <div className="flex items-center justify-between animate-fade-in-up">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display font-bold text-3xl text-white tracking-tight">
                  运营数据分析
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-500/15 text-violet-400 border border-violet-500/25">
                  <Activity size={12} />
                  仪表盘
                </span>
              </div>
              <p className="text-slate-400">准点率分析、拥挤度统计、历史轨迹回放</p>
            </div>

            <div className="flex gap-2 p-1.5 rounded-xl bg-slate-900/60 border border-slate-700/40">
              <button
                onClick={() => setTab("stats")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
                  tab === "stats"
                    ? "bg-brand-400/20 text-brand-300"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
              >
                <BarChart3 size={17} />
                准点率统计
              </button>
              <button
                onClick={() => setTab("trajectory")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
                  tab === "trajectory"
                    ? "bg-brand-400/20 text-brand-300"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
              >
                <History size={17} />
                轨迹回放
              </button>
            </div>
          </div>

          {tab === "stats" ? (
            <StatsCharts data={punctuality} className="animate-fade-in-up" />
          ) : (
            <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-4 space-y-6">
                  <div className="p-6 rounded-2xl glass border border-slate-700/40">
                    <div className="flex items-center gap-2 mb-5">
                      <Calendar size={18} className="text-violet-400" />
                      <h3 className="font-display font-semibold text-white">回放参数</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-400 mb-2 block">选择线路</label>
                        <div className="space-y-2">
                          {routes.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => {
                                setTrajectoryRouteId(r.id);
                                setPlaybackProgress(0);
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left",
                                trajectoryRouteId === r.id
                                  ? "border-violet-500/50 bg-violet-500/10"
                                  : "border-slate-700/40 bg-slate-900/50 hover:bg-slate-800/60"
                              )}
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${r.color}22` }}
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: r.color }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-white truncate">
                                  {r.name}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {r.stations.length} 站 · {r.operatingHours}
                                </div>
                              </div>
                              <TrendingUp size={16} className="text-slate-500" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 mb-2 block">选择日期</label>
                        <input
                          type="date"
                          value={trajectoryDate}
                          onChange={(e) => setTrajectoryDate(e.target.value)}
                          className="w-full p-3 rounded-xl bg-slate-900/80 border border-slate-700/40 text-slate-200 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 mb-2 block flex items-center justify-between">
                          <span>回放速度</span>
                          <span className="font-mono text-violet-400">{playbackSpeed}x</span>
                        </label>
                        <div className="flex gap-2">
                          {[0.5, 1, 2, 4].map((s) => (
                            <button
                              key={s}
                              onClick={() => setPlaybackSpeed(s)}
                              className={cn(
                                "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                                playbackSpeed === s
                                  ? "bg-violet-500/25 text-violet-300 border border-violet-500/40"
                                  : "bg-slate-800/60 text-slate-400 border border-slate-700/40"
                              )}
                            >
                              {s}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handlePlayPause}
                          className={cn(
                            "btn-primary flex-1 py-3 rounded-xl font-medium transition-all",
                            isPlaying
                              ? "bg-gradient-to-r from-rose-500 to-red-500 text-white hover:shadow-glow-rose"
                              : "bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:shadow-[0_0_32px_rgba(139,92,246,0.4)]"
                          )}
                        >
                          {isPlaying ? "⏸ 暂停" : "▶ 开始回放"}
                        </button>
                        <button
                          onClick={() => {
                            setPlaybackProgress(0);
                            setIsPlaying(false);
                          }}
                          className="px-5 py-3 rounded-xl font-medium text-slate-300 bg-slate-800/60 border border-slate-700/40 hover:bg-slate-800 transition-all"
                        >
                          重置
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl glass border border-slate-700/40">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <Users size={18} className="text-violet-400" />
                        <h3 className="font-display font-semibold text-white">回放进度</h3>
                      </div>
                      <span className="font-mono text-xs text-violet-400">
                        {Math.round(playbackProgress * 100)}%
                      </span>
                    </div>

                    <div className="mb-5">
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 timeline-fill"
                          style={{ width: `${playbackProgress * 100}%` }}
                        />
                      </div>
                    </div>

                    {trajectoryRoute && (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                        {trajectoryRoute.stations.map((s, idx) => {
                          const stationProgress =
                            idx / Math.max(1, trajectoryRoute.stations.length - 1);
                          const reached = playbackProgress >= stationProgress;
                          const eta = Math.max(
                            0,
                            Math.round((stationProgress - playbackProgress) * 30)
                          );
                          return (
                            <div
                              key={s.id}
                              className={cn(
                                "flex items-center justify-between p-2.5 rounded-lg text-sm transition-all",
                                reached ? "bg-slate-800/40" : "bg-transparent"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                    reached
                                      ? "bg-emerald-500/30 text-emerald-400"
                                      : "bg-slate-700/50 text-slate-500"
                                  )}
                                >
                                  {reached ? "✓" : idx + 1}
                                </span>
                                <span className={reached ? "text-slate-200" : "text-slate-400"}>
                                  {s.name}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {reached ? "已通过" : `还有 ${eta}s`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-8 space-y-6">
                  <div className="p-6 rounded-2xl glass border border-slate-700/40">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <History size={18} className="text-sky-400" />
                        <h3 className="font-display font-semibold text-white text-lg">
                          {trajectoryRoute?.name ?? "历史轨迹回放"}
                        </h3>
                      </div>
                      <div className="text-xs text-slate-500">
                        实时预览 · {trajectoryDate}
                      </div>
                    </div>
                    <ParkMap
                      routes={trajectoryRoute ? [trajectoryRoute] : []}
                      vehicles={trajectoryRoute ? trajectoryVehicles : []}
                      highlightRouteId={trajectoryRouteId}
                      className="h-[620px]"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {[
                      {
                        label: "总班次",
                        value: "128",
                        delta: "+12%",
                        color: "text-sky-400",
                      },
                      {
                        label: "平均用时",
                        value: "38 分",
                        delta: "-2 分",
                        color: "text-emerald-400",
                      },
                      {
                        label: "准点率",
                        value: "94.5%",
                        delta: "+1.2%",
                        color: "text-violet-400",
                      },
                      {
                        label: "平均载客",
                        value: "28 人",
                        delta: "+8%",
                        color: "text-amber-400",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="p-5 rounded-2xl glass border border-slate-700/40"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-slate-400">{s.label}</span>
                          <span className={cn("text-xs font-semibold", s.color)}>
                            {s.delta}
                          </span>
                        </div>
                        <div className="font-display font-bold text-2xl text-white count-number">
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
