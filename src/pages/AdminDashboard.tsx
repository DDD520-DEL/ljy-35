import { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  BarChart3,
  History,
  Calendar,
  Activity,
  Users,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import ParkMap from "@/components/ParkMap";
import StatsCharts from "@/components/StatsCharts";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#0EA5E9", "#14B8A6", "#8B5CF6", "#F59E0B", "#F43F5E"];

export default function AdminDashboard() {
  const routes = useAppStore((s) => s.routes);
  const vehicles = useAppStore((s) => s.vehicles);
  const punctuality = useAppStore((s) => s.punctualityStats);
  const rideStats = useAppStore((s) => s.rideStats);
  const fetchRideStats = useAppStore((s) => s.fetchRideStats);
  const [tab, setTab] = useState<"stats" | "ridership" | "trajectory">("stats");
  const [trajectoryRouteId, setTrajectoryRouteId] = useState<string>(routes[0]?.id ?? "");
  const [trajectoryDate, setTrajectoryDate] = useState("2024-01-15");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [ridershipDate, setRidershipDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [ridershipRouteId, setRidershipRouteId] = useState<string | null>(null);

  useEffect(() => {
    if (tab === "ridership") {
      void fetchRideStats(ridershipDate, ridershipRouteId ?? undefined);
    }
  }, [tab, ridershipDate, ridershipRouteId, fetchRideStats]);

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
                onClick={() => setTab("ridership")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
                  tab === "ridership"
                    ? "bg-brand-400/20 text-brand-300"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
              >
                <Users size={17} />
                乘车统计
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
          ) : tab === "ridership" ? (
            <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-3 space-y-6">
                  <div className="p-6 rounded-2xl glass border border-slate-700/40">
                    <div className="flex items-center gap-2 mb-5">
                      <Calendar size={18} className="text-sky-400" />
                      <h3 className="font-display font-semibold text-white">统计筛选</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-400 mb-2 block">选择日期</label>
                        <input
                          type="date"
                          value={ridershipDate}
                          onChange={(e) => setRidershipDate(e.target.value)}
                          className="w-full p-3 rounded-xl bg-slate-900/80 border border-slate-700/40 text-slate-200 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 mb-2 block">选择线路</label>
                        <div className="space-y-2">
                          <button
                            onClick={() => setRidershipRouteId(null)}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                              ridershipRouteId === null
                                ? "border-sky-500/50 bg-sky-500/10"
                                : "border-slate-700/40 bg-slate-900/50 hover:bg-slate-800/60"
                            )}
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                              <BarChart3 size={14} className="text-slate-400" />
                            </div>
                            <span className="text-sm text-white">全部线路</span>
                          </button>
                          {routes.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => setRidershipRouteId(r.id)}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                ridershipRouteId === r.id
                                  ? "border-sky-500/50 bg-sky-500/10"
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
                              <span className="text-sm text-white">{r.shortName}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl glass border border-slate-700/40">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity size={18} className="text-emerald-400" />
                      <h3 className="font-display font-semibold text-white">数据概览</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">总乘车人次</span>
                        <span className="text-xl font-bold text-white">
                          {rideStats.reduce((sum, s) => sum + s.totalRides, 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">独立乘客</span>
                        <span className="text-xl font-bold text-white">
                          {rideStats.reduce((sum, s) => sum + s.uniquePassengers, 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">线路数</span>
                        <span className="text-xl font-bold text-white">
                          {rideStats.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-9 space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      {
                        label: "今日总乘车",
                        value: rideStats.reduce((sum, s) => sum + s.totalRides, 0),
                        icon: Users,
                        color: "text-sky-400",
                        bg: "from-sky-500/15",
                      },
                      {
                        label: "高峰时段",
                        value:
                          rideStats.length > 0
                            ? `${rideStats[0].peakHour}:00`
                            : "--",
                        icon: Clock,
                        color: "text-amber-400",
                        bg: "from-amber-500/15",
                      },
                      {
                        label: "最忙线路",
                        value:
                          rideStats.length > 0
                            ? rideStats.reduce(
                                (max, s) =>
                                  s.totalRides > max.totalRides ? s : max,
                                rideStats[0]
                              ).routeName.slice(0, 4)
                            : "--",
                        icon: TrendingUp,
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
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-slate-400">{s.label}</span>
                          <s.icon size={18} className={s.color} />
                        </div>
                        <div className="font-display font-bold text-2xl text-white count-number">
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 rounded-2xl glass border border-slate-700/40">
                    <h3 className="font-display font-semibold text-white text-lg mb-4">
                      小时客流分布
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={
                            rideStats.length > 0
                              ? rideStats[0].hourlyData.map((h) => ({
                                  hour: `${h.hour}:00`,
                                  乘车人次: h.count,
                                }))
                              : []
                          }
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(148,163,184,0.08)"
                          />
                          <XAxis
                            dataKey="hour"
                            stroke="rgba(148,163,184,0.5)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="rgba(148,163,184,0.5)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(15,23,42,0.95)",
                              border: "1px solid rgba(148,163,184,0.2)",
                              borderRadius: "12px",
                              fontSize: 12,
                              color: "#fff",
                            }}
                          />
                          <Bar
                            dataKey="乘车人次"
                            fill="#0EA5E9"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl glass border border-slate-700/40">
                      <h3 className="font-display font-semibold text-white text-lg mb-4">
                        各线路客流对比
                      </h3>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={rideStats.map((s) => ({
                              name: s.routeName.replace("园区", "").replace("线", ""),
                              乘车人次: s.totalRides,
                            }))}
                            layout="vertical"
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="rgba(148,163,184,0.08)"
                            />
                            <XAxis
                              type="number"
                              stroke="rgba(148,163,184,0.5)"
                              fontSize={11}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              dataKey="name"
                              type="category"
                              stroke="rgba(148,163,184,0.5)"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(15,23,42,0.95)",
                                border: "1px solid rgba(148,163,184,0.2)",
                                borderRadius: "12px",
                                fontSize: 12,
                                color: "#fff",
                              }}
                            />
                            <Bar
                              dataKey="乘车人次"
                              fill="#8B5CF6"
                              radius={[0, 6, 6, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl glass border border-slate-700/40">
                      <h3 className="font-display font-semibold text-white text-lg mb-4">
                        站点客流分布
                      </h3>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          {rideStats.length > 0 && rideStats[0].stationData.length > 0 ? (
                            <PieChart>
                              <Pie
                                data={rideStats[0].stationData
                                  .filter((s) => s.count > 0)
                                  .slice(0, 6)
                                  .map((s) => ({
                                    name: s.stationName.slice(0, 4),
                                    value: s.count,
                                  }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={75}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {rideStats[0].stationData.map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                                    stroke="rgba(15,23,42,0.9)"
                                    strokeWidth={2}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "rgba(15,23,42,0.95)",
                                  border: "1px solid rgba(148,163,184,0.2)",
                                  borderRadius: "12px",
                                  fontSize: 12,
                                  color: "#fff",
                                }}
                              />
                            </PieChart>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                              暂无数据
                            </div>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl glass border border-slate-700/40">
                    <h3 className="font-display font-semibold text-white text-lg mb-4">
                      各线路详情
                    </h3>
                    <div className="space-y-4">
                      {rideStats.map((stat, i) => (
                        <div
                          key={stat.routeId}
                          className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/40"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                              />
                              <span className="font-medium text-white">
                                {stat.routeName}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-slate-400">
                                乘车人次: <span className="text-white font-semibold">{stat.totalRides}</span>
                              </span>
                              <span className="text-slate-400">
                                独立乘客: <span className="text-white font-semibold">{stat.uniquePassengers}</span>
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-6 gap-2">
                            {stat.stationData.map((s) => (
                              <div
                                key={s.stationId}
                                className="p-2 rounded-lg bg-slate-900/50 text-center"
                              >
                                <div className="text-xs text-slate-500 truncate">
                                  {s.stationName}
                                </div>
                                <div className="text-sm font-bold text-white mt-1">
                                  {s.count}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
