import { useNavigate, useLocation } from "react-router-dom";
import {
  User,
  CarFront,
  LayoutDashboard,
  Map,
  ArrowLeft,
  LogOut,
  Bus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";

interface SidebarProps {
  className?: string;
}

const navItems = [
  { to: "/passenger", icon: Map, label: "实时地图", role: "passenger" as const },
  { to: "/driver", icon: CarFront, label: "司机控制台", role: "driver" as const },
  { to: "/admin", icon: LayoutDashboard, label: "数据分析", role: "admin" as const },
];

export default function Sidebar({ className }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = useAppStore((s) => s.userRole);
  const setUserRole = useAppStore((s) => s.setUserRole);

  const roleInfo = {
    passenger: { icon: User, label: "乘客端", color: "text-sky-400", bg: "from-sky-500/10" },
    driver: { icon: CarFront, label: "司机端", color: "text-emerald-400", bg: "from-emerald-500/10" },
    admin: { icon: LayoutDashboard, label: "管理员", color: "text-violet-400", bg: "from-violet-500/10" },
  };

  const info = userRole ? roleInfo[userRole] : null;
  const filteredNav = navItems.filter((n) => !userRole || n.role === userRole);

  const handleLogout = () => {
    setUserRole(null);
    navigate("/");
  };

  return (
    <aside
      className={cn(
        "w-64 h-screen flex-shrink-0 flex flex-col glass border-r border-slate-700/40",
        className
      )}
    >
      <div className="p-5 border-b border-slate-700/40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-glow">
            <Bus size={22} className="text-white" strokeWidth={2.3} />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight text-white">
              园区摆渡车
            </h1>
            <p className="text-xs text-slate-400">实时追踪系统 v1.0</p>
          </div>
        </div>
      </div>

      {info && (
        <div
          className={cn(
            "mx-4 mt-4 p-4 rounded-xl border border-slate-700/40 bg-gradient-to-br",
            info.bg,
            "to-transparent"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg bg-slate-800/80 flex items-center justify-center", info.color)}>
              <info.icon size={20} />
            </div>
            <div>
              <div className="text-sm font-medium text-white">{info.label}</div>
              <div className="text-xs text-slate-400">已登录</div>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 px-3">
          功能导航
        </div>
        {filteredNav.map((item) => {
          const active = location.pathname.startsWith(item.to);
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-brand-400/15 text-brand-300 border border-brand-400/30 shadow-[0_0_0_1px_rgba(14,165,233,0.08)]"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent"
              )}
            >
              <item.icon size={18} />
              {item.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 shadow-glow" />}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/40 space-y-2">
        <button
          onClick={() => navigate(-1)}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all"
        >
          <ArrowLeft size={17} />
          返回上一页
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <LogOut size={17} />
          切换身份
        </button>
      </div>
    </aside>
  );
}
