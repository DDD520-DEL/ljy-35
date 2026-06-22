import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { TrendingUp, Clock, AlertTriangle, Bus } from "lucide-react";
import type { PunctualityStats } from "@shared/types";
import { cn } from "@/lib/utils";

interface StatsChartsProps {
  data: PunctualityStats[];
  className?: string;
}

const PIE_COLORS = ["#0EA5E9", "#14B8A6", "#8B5CF6", "#F59E0B", "#F43F5E"];

export default function StatsCharts({ data, className }: StatsChartsProps) {
  const [tab, setTab] = useState<"overview" | "daily" | "radar">("overview");

  const overviewData = useMemo(
    () =>
      data.map((d) => ({
        name: d.routeName.replace("园区", "").replace("线", ""),
        准点率: Math.round(d.onTimeRate * 100),
        目标: 92,
        平均延迟: d.averageDelay,
      })),
    [data]
  );

  const dailyData = useMemo(() => {
    if (data.length === 0) return [];
    const route1Daily = data[0].dailyData;
    return route1Daily.map((_, i) => {
      const item: Record<string, string | number> = { date: _.date };
      data.forEach((d) => {
        item[d.routeName.slice(0, 4)] = Math.round((d.dailyData[i]?.rate ?? 0) * 100);
      });
      return item;
    });
  }, [data]);

  const radarData = useMemo(
    () =>
      data.map((d) => ({
        subject: d.routeName.replace("园区", "").replace("线", ""),
        准点率: Math.round(d.onTimeRate * 100),
        总班次: Math.min(100, d.totalTrips / 5),
        稳定性: Math.round((1 - d.averageDelay / 10) * 100),
      })),
    [data]
  );

  const overallStats = useMemo(() => {
    const totalTrips = data.reduce((sum, d) => sum + d.totalTrips, 0);
    const totalOnTime = data.reduce((sum, d) => sum + d.onTimeTrips, 0);
    const avgRate = totalTrips > 0 ? totalOnTime / totalTrips : 0;
    const avgDelay =
      data.reduce((sum, d) => sum + d.averageDelay * d.totalTrips, 0) / Math.max(1, totalTrips);
    return { totalTrips, totalOnTime, avgRate, avgDelay };
  }, [data]);

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "今日总班次",
            value: overallStats.totalTrips.toLocaleString(),
            icon: Bus,
            color: "text-sky-400",
            bg: "from-sky-500/15",
          },
          {
            label: "准点班次",
            value: overallStats.totalOnTime.toLocaleString(),
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "from-emerald-500/15",
          },
          {
            label: "整体准点率",
            value: `${Math.round(overallStats.avgRate * 100)}%`,
            icon: Clock,
            color: "text-violet-400",
            bg: "from-violet-500/15",
          },
          {
            label: "平均延误",
            value: `${overallStats.avgDelay.toFixed(1)} 分`,
            icon: AlertTriangle,
            color: "text-amber-400",
            bg: "from-amber-500/15",
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
            <div className="font-display font-bold text-3xl text-white count-number">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 p-1.5 rounded-xl bg-slate-800/50 w-fit">
        {[
          { key: "overview", label: "线路概览" },
          { key: "daily", label: "每日趋势" },
          { key: "radar", label: "综合雷达" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all",
              tab === t.key
                ? "bg-brand-400/20 text-brand-300 border border-brand-400/30"
                : "text-slate-400 hover:text-white hover:bg-slate-700/40"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl glass border border-slate-700/40">
          <h3 className="font-display font-semibold text-white text-lg mb-4">
            各线路准点率对比
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {tab === "overview" ? (
                <BarChart data={overviewData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis
                    dataKey="name"
                    stroke="rgba(148,163,184,0.5)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(148,163,184,0.5)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[50, 100]}
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
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="准点率" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="目标" fill="rgba(100,116,139,0.4)" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : tab === "daily" ? (
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis
                    dataKey="date"
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
                    domain={[70, 100]}
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
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {data.map((d, i) => (
                    <Line
                      key={d.routeId}
                      type="monotone"
                      dataKey={d.routeName.slice(0, 4)}
                      stroke={PIE_COLORS[i % PIE_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              ) : (
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(148,163,184,0.1)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    stroke="rgba(148,163,184,0.5)"
                    fontSize={12}
                  />
                  <PolarRadiusAxis
                    stroke="rgba(148,163,184,0.3)"
                    fontSize={10}
                    domain={[0, 100]}
                  />
                  <Radar
                    name="准点率"
                    dataKey="准点率"
                    stroke="#0EA5E9"
                    fill="#0EA5E9"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="稳定性"
                    dataKey="稳定性"
                    stroke="#14B8A6"
                    fill="#14B8A6"
                    fillOpacity={0.25}
                  />
                  <Radar
                    name="班次量"
                    dataKey="总班次"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.2}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(148,163,184,0.2)",
                      borderRadius: "12px",
                      fontSize: 12,
                      color: "#fff",
                    }}
                  />
                </RadarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass border border-slate-700/40">
            <h3 className="font-display font-semibold text-white text-lg mb-4">
              班次占比分布
            </h3>
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.map((d) => ({
                      name: d.routeName.slice(0, 6),
                      value: d.totalTrips,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.map((_, i) => (
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
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {data.map((d, i) => (
                <div key={d.routeId} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-xs text-slate-300">{d.routeName}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl glass border border-slate-700/40">
            <h3 className="font-display font-semibold text-white text-lg mb-4">
              各线路详情
            </h3>
            <div className="space-y-3">
              {data.map((d, i) => (
                <div key={d.routeId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-slate-200 font-medium">{d.routeName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400 text-xs">
                        {d.onTimeTrips}/{d.totalTrips} 准点
                      </span>
                      <span
                        className="font-mono font-bold text-sm"
                        style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}
                      >
                        {Math.round(d.onTimeRate * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${d.onTimeRate * 100}%`,
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                        boxShadow: `0 0 12px ${PIE_COLORS[i % PIE_COLORS.length]}55`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
