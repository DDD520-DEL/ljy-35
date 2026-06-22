import { useNavigate } from "react-router-dom";
import { User, CarFront, LayoutDashboard, ArrowRight, Bus, MapPin } from "lucide-react";
import { useAppStore } from "@/store";
import { useVehicleSimulation } from "@/hooks/useVehicleSimulation";
import { cn } from "@/lib/utils";

const roles = [
  {
    key: "passenger" as const,
    icon: User,
    title: "乘客端",
    desc: "查看实时车辆位置、预估到达时间，设置到站提醒",
    color: "from-sky-500 via-cyan-400 to-blue-600",
    accent: "text-sky-400",
    shadow: "hover:shadow-[0_20px_60px_-15px_rgba(14,165,233,0.5)]",
    to: "/passenger",
  },
  {
    key: "driver" as const,
    icon: CarFront,
    title: "司机端",
    desc: "选择驾驶线路，实时上报GPS位置，查看运行状态",
    color: "from-emerald-500 via-teal-400 to-green-600",
    accent: "text-emerald-400",
    shadow: "hover:shadow-[0_20px_60px_-15px_rgba(20,184,166,0.5)]",
    to: "/driver",
  },
  {
    key: "admin" as const,
    icon: LayoutDashboard,
    title: "管理员端",
    desc: "查看运营数据统计、准点率分析、历史轨迹回放",
    color: "from-violet-500 via-purple-400 to-fuchsia-600",
    accent: "text-violet-400",
    shadow: "hover:shadow-[0_20px_60px_-15px_rgba(139,92,246,0.5)]",
    to: "/admin",
  },
];

export default function RoleSelect() {
  const navigate = useNavigate();
  const setUserRole = useAppStore((s) => s.setUserRole);
  const routes = useAppStore((s) => s.routes);
  const vehicles = useAppStore((s) => s.vehicles);
  useVehicleSimulation();

  const runningVehicles = vehicles.filter((v) => v.status === "running").length;

  const handleSelect = (role: (typeof roles)[number]) => {
    setUserRole(role.key);
    navigate(role.to);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-6xl w-full mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-slate-700/50 bg-slate-900/60 backdrop-blur mb-8">
            <div className="relative">
              <Bus size={20} className="text-sky-400" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-sm font-medium text-slate-300">
              实时追踪系统运行中 · {runningVehicles} 辆车在线
            </span>
          </div>

          <h1 className="font-display font-bold text-5xl md:text-6xl tracking-tight mb-5 bg-gradient-to-r from-white via-sky-100 to-sky-200 bg-clip-text text-transparent">
            园区摆渡车实时追踪
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            实时定位每一辆摆渡车，预估到站时间，开启智能提醒
            <br />
            让通勤更高效，等车更从容
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {roles.map((role, idx) => (
            <button
              key={role.key}
              onClick={() => handleSelect(role)}
              style={{ animationDelay: `${idx * 100 + 200}ms` }}
              className={cn(
                "group relative text-left p-7 rounded-3xl border border-slate-700/40",
                "bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-800/60",
                "backdrop-blur-xl transition-all duration-500",
                "hover:-translate-y-3 hover:border-slate-600/60",
                role.shadow,
                "animate-fade-in-up"
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  role.color,
                  "-z-10 blur-xl scale-90"
                )}
              />

              <div
                className={cn(
                  "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
                  role.color
                )}
              >
                <role.icon size={30} className="text-white" strokeWidth={2} />
              </div>

              <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-3">
                {role.title}
                <span
                  className={cn(
                    "inline-flex items-center translate-x-0 opacity-100 group-hover:translate-x-2 transition-all duration-300",
                    role.accent
                  )}
                >
                  <ArrowRight size={18} />
                </span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-5">{role.desc}</p>

              <div
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                  "bg-white/5 text-slate-300 group-hover:bg-white/15 group-hover:text-white",
                  "border border-white/5 group-hover:border-white/10"
                )}
              >
                进入系统
                <ArrowRight size={14} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-10 animate-fade-in-up" style={{ animationDelay: "600ms" }}>
          {[
            { label: "运营线路", value: routes.length },
            { label: "在线车辆", value: runningVehicles },
            { label: "覆盖站点", value: routes.reduce((sum, r) => sum + r.stations.length, 0) },
            { label: "平均准点率", value: "93.8%" },
          ].map((s, i) => (
            <div key={s.label} className="text-center">
              <div className="font-mono font-bold text-3xl text-white count-number mb-1">
                {s.value}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16 flex items-center justify-center gap-2 text-xs text-slate-600 animate-fade-in-up" style={{ animationDelay: "800ms" }}>
          <MapPin size={12} />
          <span>GPS定位 · 实时数据模拟 · 无需后端服务</span>
        </div>
      </div>
    </div>
  );
}
