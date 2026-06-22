import { useMemo, useState, useEffect } from "react";
import { Search, Filter, Bell, RefreshCw, Locate, QrCode, Ticket } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ParkMap from "@/components/ParkMap";
import RouteCard from "@/components/RouteCard";
import CheckInModal from "@/components/CheckInModal";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

export default function PassengerHome() {
  const routes = useAppStore((s) => s.routes);
  const vehicles = useAppStore((s) => s.vehicles);
  const reminders = useAppStore((s) => s.reminders);
  const activeCheckIn = useAppStore((s) => s.activeCheckIn);
  const fetchActiveCheckIn = useAppStore((s) => s.fetchActiveCheckIn);
  const [search, setSearch] = useState("");
  const [highlightRouteId, setHighlightRouteId] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState(false);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);

  useEffect(() => {
    void fetchActiveCheckIn();
  }, [fetchActiveCheckIn]);

  const filteredRoutes = useMemo(() => {
    let result = routes;
    if (search) {
      result = result.filter(
        (r) =>
          r.name.includes(search) ||
          r.shortName.includes(search) ||
          r.stations.some((s) => s.name.includes(search))
      );
    }
    if (filterActive) {
      result = result.filter((r) =>
        vehicles.some((v) => v.routeId === r.id && v.status === "running")
      );
    }
    return result;
  }, [routes, search, filterActive, vehicles]);

  const activeRemindersCount = reminders.filter((r) => !r.notified).length;
  const runningTotal = vehicles.filter((v) => v.status === "running").length;

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />

      <main className="flex-1 overflow-y-auto min-h-screen">
        <div className="p-8 max-w-[1400px] mx-auto">
          <header className="flex items-center justify-between mb-8 animate-fade-in-up">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display font-bold text-3xl text-white tracking-tight">
                  实时班车地图
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  实时更新中
                </span>
              </div>
              <p className="text-slate-400">
                共 {runningTotal} 辆班车运行中 · 数据每 2 秒刷新
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCheckInModalOpen(true)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all",
                  activeCheckIn
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:shadow-[0_0_24px_rgba(14,165,233,0.4)]"
                )}
              >
                {activeCheckIn ? (
                  <>
                    <Ticket size={18} />
                    <span className="text-sm">已乘车</span>
                  </>
                ) : (
                  <>
                    <QrCode size={18} />
                    <span className="text-sm">扫码签到</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setHighlightRouteId(null)}
                className="p-2.5 rounded-xl border border-slate-700/40 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
                title="重置地图筛选"
              >
                <Locate size={18} />
              </button>
              <button
                className="relative p-2.5 rounded-xl border border-slate-700/40 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
                title="到站提醒"
              >
                <Bell size={18} />
                {activeRemindersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-glow-rose">
                    {activeRemindersCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="p-2.5 rounded-xl border border-slate-700/40 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all hover:rotate-180 duration-700"
                title="刷新数据"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 xl:col-span-8 space-y-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <ParkMap
                routes={routes}
                vehicles={vehicles}
                highlightRouteId={highlightRouteId}
                onRouteClick={setHighlightRouteId}
                className="h-[580px]"
              />

              {highlightRouteId && (
                <div className="flex items-center justify-between p-4 rounded-xl glass border border-sky-500/30 animate-slide-in">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: routes.find((r) => r.id === highlightRouteId)?.color }}
                    />
                    <span className="font-medium text-white">
                      当前高亮：{routes.find((r) => r.id === highlightRouteId)?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setHighlightRouteId(null)}
                    className="text-sm text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    取消筛选
                  </button>
                </div>
              )}
            </div>

            <div className="col-span-12 xl:col-span-4 space-y-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <div className="p-5 rounded-2xl glass border border-slate-700/40">
                <div className="flex items-center gap-2 mb-4">
                  <Search size={17} className="text-slate-500" />
                  <input
                    type="text"
                    placeholder="搜索线路或站点..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm outline-none"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="text-xs text-slate-500 hover:text-white"
                    >
                      清除
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterActive(!filterActive)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                      filterActive
                        ? "bg-brand-400/20 text-brand-300 border border-brand-400/30"
                        : "bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/40"
                    )}
                  >
                    <Filter size={13} />
                    仅看运行中
                  </button>
                  <div className="flex-1" />
                  <span className="text-xs text-slate-500">
                    共 {filteredRoutes.length} 条
                  </span>
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {filteredRoutes.length > 0 ? (
                  filteredRoutes.map((route, idx) => (
                    <div
                      key={route.id}
                      style={{ animationDelay: `${idx * 80}ms` }}
                      className={cn(
                        "animate-slide-in",
                        highlightRouteId === route.id && "ring-2 ring-offset-2 ring-offset-bg rounded-2xl ring-sky-400/50"
                      )}
                    >
                      <RouteCard route={route} vehicles={vehicles} />
                    </div>
                  ))
                ) : (
                  <div className="p-10 rounded-2xl glass border border-slate-700/40 text-center">
                    <Search
                      size={36}
                      className="text-slate-600 mx-auto mb-3"
                    />
                    <p className="text-slate-400 text-sm">未找到匹配的线路或站点</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <CheckInModal
        isOpen={checkInModalOpen}
        onClose={() => setCheckInModalOpen(false)}
      />
    </div>
  );
}
