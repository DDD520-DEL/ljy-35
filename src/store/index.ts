import { create } from "zustand";
import type {
  Route,
  Vehicle,
  Reminder,
  PunctualityStats,
  Toast,
  UserRole,
  CrowdLevel,
  ApiResponse,
  CheckInRecord,
  CheckInRecordDetail,
  RideStats,
  ActiveTrip,
  QRCodeData,
} from "@shared/types";
import { MOCK_ROUTES, MOCK_VEHICLES, MOCK_PUNCTUALITY_STATS } from "@/data/mockData";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const MOCK_USER_ID = "user_demo_001";

interface AppState {
  userRole: UserRole;
  routes: Route[];
  vehicles: Vehicle[];
  reminders: Reminder[];
  punctualityStats: PunctualityStats[];
  toasts: Toast[];
  selectedRouteId: string | null;
  driverVehicleId: string | null;
  lastServerSync: number;
  checkInRecords: CheckInRecord[];
  activeCheckIn: CheckInRecordDetail | null;
  rideStats: RideStats[];
  activeTrip: ActiveTrip | null;
  qrCodeData: QRCodeData | null;

  setUserRole: (role: UserRole) => void;
  setSelectedRouteId: (id: string | null) => void;
  setDriverVehicleId: (id: string | null) => void;

  updateVehicleProgress: (vehicleId: string, progress: number, position: { x: number; y: number }, stationIndex: number) => void;
  updateVehicleStatus: (vehicleId: string, status: Vehicle["status"], startTimestamp?: number) => void;

  submitCrowdFeedback: (vehicleId: string, level: CrowdLevel) => Promise<void>;

  generateQRCode: (vehicleId: string, stationId: string) => Promise<void>;
  refreshQRCode: () => Promise<void>;
  clearQRCode: () => void;
  passengerCheckIn: (token: string) => Promise<CheckInRecordDetail | null>;
  fetchActiveCheckIn: () => Promise<void>;
  fetchRideStats: (date: string, routeId?: string) => Promise<void>;
  fetchCheckInRecords: (filters?: { userId?: string; vehicleId?: string; routeId?: string; date?: string }) => Promise<void>;

  createReminder: (reminder: Omit<Reminder, "id" | "userId" | "notified" | "pushStatus" | "pushChannel" | "triggerThreshold" | "createdAt"> & {
    pushChannel?: Reminder["pushChannel"];
    triggerThreshold?: number;
  }) => Promise<Reminder | null>;
  cancelReminder: (reminderId: string) => Promise<boolean>;
  markReminderNotified: (reminderId: string) => void;
  removeReminder: (reminderId: string) => void;

  syncFromServer: () => Promise<void>;

  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

let syncTimerId: number | null = null;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  const data = (await res.json()) as ApiResponse<T>;
  return data;
}

export const useAppStore = create<AppState>((set, get) => {
  if (typeof window !== "undefined" && syncTimerId === null) {
    syncTimerId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        get().syncFromServer().catch((err) => {
          console.warn("[Store] periodic sync failed:", err);
        });
      }
    }, 3000);
  }

  return {
    userRole: null,
    routes: MOCK_ROUTES,
    vehicles: JSON.parse(JSON.stringify(MOCK_VEHICLES)),
    reminders: [],
    punctualityStats: MOCK_PUNCTUALITY_STATS,
    toasts: [],
    selectedRouteId: null,
    driverVehicleId: null,
    lastServerSync: 0,
    checkInRecords: [],
    activeCheckIn: null,
    rideStats: [],
    activeTrip: null,
    qrCodeData: null,

    setUserRole: (role) => set({ userRole: role }),
    setSelectedRouteId: (id) => set({ selectedRouteId: id }),
    setDriverVehicleId: (id) => set({ driverVehicleId: id }),

    updateVehicleProgress: (vehicleId, progress, position, stationIndex) => {
      set((state) => ({
        vehicles: state.vehicles.map((v) =>
          v.id === vehicleId
            ? {
                ...v,
                progress,
                position,
                currentStationIndex: stationIndex,
                lastReportTime: Date.now(),
              }
            : v
        ),
      }));
    },

    updateVehicleStatus: (vehicleId, status, startTimestamp) => {
      set((state) => ({
        vehicles: state.vehicles.map((v) =>
          v.id === vehicleId
            ? {
                ...v,
                status,
                startTimestamp: startTimestamp ?? v.startTimestamp,
              }
            : v
        ),
      }));
    },

    submitCrowdFeedback: async (vehicleId, level) => {
      try {
        const res = await apiFetch<{ vehicleId: string; level: CrowdLevel }>(
          `/shuttle/vehicles/${vehicleId}/crowd`,
          { method: "POST", body: JSON.stringify({ level }) }
        );
        if (!res.success) {
          throw new Error(res.error || "反馈失败");
        }
      } catch (_err) {
        void _err;
        console.warn("[Store] submit feedback to server failed, using local fallback");
      }

      set((state) => ({
        vehicles: state.vehicles.map((v) => {
          if (v.id !== vehicleId) return v;
          const votes = { ...v.crowdVotes, [level]: v.crowdVotes[level] + 1 };
          const total = votes.loose + votes.normal + votes.crowded;
          let crowdLevel: CrowdLevel = "normal";
          if (total > 0) {
            const pL = votes.loose / total;
            const pC = votes.crowded / total;
            if (pL > pC && pL > 0.4) crowdLevel = "loose";
            else if (pC > pL && pC > 0.4) crowdLevel = "crowded";
          }
          return { ...v, crowdVotes: votes, crowdLevel };
        }),
      }));
      get().addToast({ type: "success", message: "感谢您的反馈！", duration: 2500 });
    },

    generateQRCode: async (vehicleId, stationId) => {
      try {
        const res = await apiFetch<QRCodeData>("/checkin/qrcode/generate", {
          method: "POST",
          body: JSON.stringify({ vehicleId, stationId }),
        });

        if (!res.success || !res.data) {
          throw new Error(res.error || "生成二维码失败");
        }

        set({ qrCodeData: res.data });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "生成二维码失败";
        console.error("[Store] generate QR code failed:", err);
        get().addToast({ type: "error", message: msg, duration: 3000 });
      }
    },

    refreshQRCode: async () => {
      const { driverVehicleId, routes, vehicles } = get();
      if (!driverVehicleId) return;

      const vehicle = vehicles.find((v) => v.id === driverVehicleId);
      if (!vehicle) return;

      const route = routes.find((r) => r.id === vehicle.routeId);
      const stationId = route?.stations[vehicle.currentStationIndex]?.id;
      if (!stationId) return;

      await get().generateQRCode(driverVehicleId, stationId);
    },

    clearQRCode: () => {
      set({ qrCodeData: null });
    },

    passengerCheckIn: async (token) => {
      try {
        const res = await apiFetch<CheckInRecordDetail>("/checkin/checkin", {
          method: "POST",
          body: JSON.stringify({ token, userId: MOCK_USER_ID }),
        });

        if (!res.success || !res.data) {
          throw new Error(res.error || "签到失败");
        }

        set({ activeCheckIn: res.data });
        get().addToast({ type: "success", message: "签到成功！祝您乘车愉快", duration: 3000 });

        void get().syncFromServer();

        return res.data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "签到失败";
        console.error("[Store] check in failed:", err);
        get().addToast({ type: "error", message: msg, duration: 3000 });
        return null;
      }
    },

    fetchActiveCheckIn: async () => {
      try {
        const res = await apiFetch<CheckInRecordDetail>(`/checkin/active/${MOCK_USER_ID}`);

        if (res.success && res.data) {
          set({ activeCheckIn: res.data });
        } else {
          set({ activeCheckIn: null });
        }
      } catch (err) {
        console.warn("[Store] fetch active check-in failed:", err);
      }
    },

    fetchRideStats: async (date, routeId) => {
      try {
        const params = new URLSearchParams();
        params.set("date", date);
        if (routeId) params.set("routeId", routeId);

        const res = await apiFetch<RideStats[]>(`/checkin/stats?${params.toString()}`);

        if (res.success && res.data) {
          set({ rideStats: res.data });
        }
      } catch (err) {
        console.warn("[Store] fetch ride stats failed:", err);
      }
    },

    fetchCheckInRecords: async (filters) => {
      try {
        const params = new URLSearchParams();
        if (filters?.userId) params.set("userId", filters.userId);
        if (filters?.vehicleId) params.set("vehicleId", filters.vehicleId);
        if (filters?.routeId) params.set("routeId", filters.routeId);
        if (filters?.date) params.set("date", filters.date);

        const res = await apiFetch<CheckInRecord[]>(`/checkin/records?${params.toString()}`);

        if (res.success && res.data) {
          set({ checkInRecords: res.data });
        }
      } catch (err) {
        console.warn("[Store] fetch check-in records failed:", err);
      }
    },

    createReminder: async (reminder) => {
      try {
        const res = await apiFetch<Reminder>("/reminder/reminders", {
          method: "POST",
          body: JSON.stringify({
            ...reminder,
            userId: MOCK_USER_ID,
            pushChannel: reminder.pushChannel || "wechat_template",
            triggerThreshold: reminder.triggerThreshold ?? 1,
          }),
        });

        if (!res.success || !res.data) {
          throw new Error(res.error || "创建提醒失败");
        }

        set((state) => ({
          reminders: [
            ...state.reminders.filter(
              (r) => !(r.userId === MOCK_USER_ID && r.vehicleId === reminder.vehicleId && r.stationId === reminder.stationId && !r.notified)
            ),
            res.data!,
          ],
        }));

        get().addToast({
          type: "success",
          message: "到站提醒已开启，将通过微信模板消息通知您",
          duration: 3500,
        });

        return res.data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "创建提醒失败";
        console.error("[Store] create reminder failed:", err);
        get().addToast({ type: "error", message: msg, duration: 4000 });
        return null;
      }
    },

    cancelReminder: async (reminderId) => {
      try {
        const res = await apiFetch(`/reminder/reminders/${reminderId}`, {
          method: "DELETE",
        });

        if (!res.success) {
          throw new Error(res.error || "取消提醒失败");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "取消提醒失败";
        console.warn("[Store] cancel reminder server call failed:", err);
        get().addToast({ type: "warning", message: msg, duration: 3000 });
      }

      set((state) => ({
        reminders: state.reminders.map((r) =>
          r.id === reminderId
            ? { ...r, notified: true, pushStatus: r.pushStatus === "success" ? "success" : "cancelled" as Reminder["pushStatus"] }
            : r
        ),
      }));

      return true;
    },

    markReminderNotified: (reminderId) => {
      set((state) => ({
        reminders: state.reminders.map((r) =>
          r.id === reminderId ? { ...r, notified: true } : r
        ),
      }));
    },

    removeReminder: (reminderId) => {
      set((state) => ({ reminders: state.reminders.filter((r) => r.id !== reminderId) }));
    },

    syncFromServer: async () => {
      try {
        const [vehiclesRes, remindersRes] = await Promise.all([
          apiFetch<Vehicle[]>("/shuttle/vehicles"),
          apiFetch<Reminder[]>(`/reminder/reminders?userId=${MOCK_USER_ID}`),
        ]);

        if (vehiclesRes.success && vehiclesRes.data) {
          const serverVehicles = vehiclesRes.data;
          set((state) => ({
            vehicles: state.vehicles.map((local) => {
              const server = serverVehicles.find((v) => v.id === local.id);
              if (!server) return local;
              if (server.lastReportTime > local.lastReportTime) {
                return server;
              }
              return {
                ...local,
                crowdLevel: server.crowdLevel,
                crowdVotes: server.crowdVotes,
              };
            }),
          }));
        }

        if (remindersRes.success && remindersRes.data) {
          set((state) => {
            const serverReminders = remindersRes.data!;
            const existingIds = new Set(state.reminders.map((r) => r.id));
            const merged = [...state.reminders];
            serverReminders.forEach((sr) => {
              if (existingIds.has(sr.id)) {
                const idx = merged.findIndex((r) => r.id === sr.id);
                if (idx >= 0) merged[idx] = sr;
              } else if (sr.userId === MOCK_USER_ID) {
                merged.push(sr);
              }
            });
            return { reminders: merged };
          });
        }

        set({ lastServerSync: Date.now() });
      } catch (err) {
        console.warn("[Store] syncFromServer failed:", err);
      }
    },

    addToast: (toast) => {
      const id = Math.random().toString(36).slice(2, 10);
      const duration = toast.duration ?? 3000;
      set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
      if (duration > 0) {
        setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, duration);
      }
    },

    removeToast: (id) => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },
  };
});
