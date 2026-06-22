import { useState } from "react";
import { QrCode, X, Check, Bus, MapPin, Users, Clock, Ticket, Bell, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import type { CrowdLevel } from "@shared/types";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckInModal({ isOpen, onClose }: CheckInModalProps) {
  const passengerCheckIn = useAppStore((s) => s.passengerCheckIn);
  const activeCheckIn = useAppStore((s) => s.activeCheckIn);
  const routes = useAppStore((s) => s.routes);
  const createReminder = useAppStore((s) => s.createReminder);
  const reminders = useAppStore((s) => s.reminders);
  const [tokenInput, setTokenInput] = useState("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showReminderSetup, setShowReminderSetup] = useState(false);
  const [isCreatingReminder, setIsCreatingReminder] = useState(false);

  const handleCheckIn = async () => {
    if (!tokenInput.trim()) return;
    setIsCheckingIn(true);
    try {
      await passengerCheckIn(tokenInput.trim());
    } finally {
      setIsCheckingIn(false);
    }
  };

  const checkInRoute = activeCheckIn
    ? routes.find((r) => r.id === activeCheckIn.routeId)
    : null;

  const checkInStationIndex = checkInRoute?.stations.findIndex(
    (s) => s.id === activeCheckIn?.stationId
  ) ?? 0;

  const upcomingStations = checkInRoute
    ? checkInRoute.stations.slice(checkInStationIndex + 1)
    : [];

  const hasActiveReminder = reminders.some(
    (r) =>
      r.vehicleId === activeCheckIn?.vehicleId &&
      !r.notified &&
      r.pushStatus !== "cancelled"
  );

  const handleQuickReminder = async (stationId: string) => {
    if (!activeCheckIn || !checkInRoute) return;
    setIsCreatingReminder(true);
    try {
      await createReminder({
        routeId: checkInRoute.id,
        vehicleId: activeCheckIn.vehicleId,
        stationId,
      });
      setShowReminderSetup(false);
    } finally {
      setIsCreatingReminder(false);
    }
  };

  const crowdLevelConfig: Record<CrowdLevel, { label: string; color: string; bg: string }> = {
    loose: { label: "宽松", color: "text-emerald-400", bg: "bg-emerald-500/20" },
    normal: { label: "正常", color: "text-amber-400", bg: "bg-amber-500/20" },
    crowded: { label: "拥挤", color: "text-rose-400", bg: "bg-rose-500/20" },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md glass rounded-3xl border border-slate-700/40 overflow-hidden animate-scale-in">
        <div className="p-6 border-b border-slate-700/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                <QrCode size={20} className="text-sky-400" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-white text-lg">扫码签到</h3>
                <p className="text-xs text-slate-400">扫描车上二维码完成乘车签到</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeCheckIn ? (
            <div className="space-y-5">
              <div className="flex items-center justify-center py-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                  <Check size={36} className="text-emerald-400" />
                </div>
              </div>

              <div className="text-center mb-4">
                <div className="text-xl font-bold text-white mb-1">签到成功</div>
                <p className="text-sm text-slate-400">祝您乘车愉快</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/40">
                  <div className="flex items-center gap-3">
                    <Bus size={18} className="text-sky-400" />
                    <span className="text-sm text-slate-400">线路</span>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {activeCheckIn.routeName || checkInRoute?.name || "--"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/40">
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-violet-400" />
                    <span className="text-sm text-slate-400">上车站点</span>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {activeCheckIn.stationName || "--"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/40">
                  <div className="flex items-center gap-3">
                    <Users size={18} className="text-emerald-400" />
                    <span className="text-sm text-slate-400">拥挤度</span>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium px-2.5 py-1 rounded-full",
                      crowdLevelConfig[activeCheckIn.crowdLevel ?? "normal"].color,
                      crowdLevelConfig[activeCheckIn.crowdLevel ?? "normal"].bg
                    )}
                  >
                    {crowdLevelConfig[activeCheckIn.crowdLevel ?? "normal"].label}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/40">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-amber-400" />
                    <span className="text-sm text-slate-400">签到时间</span>
                  </div>
                  <span className="text-sm font-mono text-white">
                    {new Date(activeCheckIn.checkInTime).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {!showReminderSetup ? (
                <div className="space-y-3 pt-2">
                  {!hasActiveReminder && upcomingStations.length > 0 && (
                    <button
                      onClick={() => setShowReminderSetup(true)}
                      className="w-full p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-between hover:bg-violet-500/15 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                          <Bell size={18} className="text-violet-400" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-white">设置到站提醒</div>
                          <div className="text-xs text-slate-400">下车前微信通知您</div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-500" />
                    </button>
                  )}

                  {hasActiveReminder && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <Check size={18} className="text-emerald-400" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">到站提醒已开启</div>
                        <div className="text-xs text-slate-400">将在到站前通知您</div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full py-3.5 rounded-xl font-medium text-white bg-gradient-to-r from-sky-500 to-blue-500 hover:shadow-[0_0_24px_rgba(14,165,233,0.4)] transition-all"
                  >
                    知道了
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setShowReminderSetup(false)}
                      className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white"
                    >
                      <ChevronRight
                        size={18}
                        className="rotate-180"
                      />
                    </button>
                    <span className="text-sm font-medium text-white">选择下车站点</span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {upcomingStations.map((station, idx) => (
                      <button
                        key={station.id}
                        onClick={() => handleQuickReminder(station.id)}
                        disabled={isCreatingReminder}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-700/40 bg-slate-800/50 hover:bg-slate-700/50 transition-all disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-sky-400">
                              {checkInStationIndex + idx + 2}
                            </span>
                          </div>
                          <span className="text-sm text-white">{station.name}</span>
                        </div>
                        <Bell size={16} className="text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex justify-center py-6">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 bg-slate-700/30 rounded-2xl border-2 border-dashed border-slate-600" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
                      <QrCode size={32} className="text-slate-500" />
                    </div>
                    <span className="text-sm text-slate-500">扫描二维码</span>
                  </div>

                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-scan" />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-bg text-slate-500">或手动输入签到码</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Ticket size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="请输入签到 Token"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700/40 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all"
                  />
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={!tokenInput.trim() || isCheckingIn}
                  className="w-full py-3.5 rounded-xl font-medium text-white bg-gradient-to-r from-sky-500 to-blue-500 hover:shadow-[0_0_24px_rgba(14,165,233,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCheckingIn ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={18} />
                      确认签到
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-300/80">
                  提示：请上车后扫描司机端二维码完成签到，签到后可自动接收到站提醒。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
