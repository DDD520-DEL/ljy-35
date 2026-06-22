import { create } from "zustand";
import type {
  Route,
  Vehicle,
  Reminder,
  PunctualityStats,
  Toast,
  UserRole,
  CrowdLevel,
} from "@shared/types";
import { MOCK_ROUTES, MOCK_VEHICLES, MOCK_PUNCTUALITY_STATS } from "@/data/mockData";

interface AppState {
  userRole: UserRole;
  routes: Route[];
  vehicles: Vehicle[];
  reminders: Reminder[];
  punctualityStats: PunctualityStats[];
  toasts: Toast[];
  selectedRouteId: string | null;
  driverVehicleId: string | null;

  setUserRole: (role: UserRole) => void;
  setSelectedRouteId: (id: string | null) => void;
  setDriverVehicleId: (id: string | null) => void;

  updateVehicleProgress: (vehicleId: string, progress: number, position: { x: number; y: number }, stationIndex: number) => void;
  updateVehicleStatus: (vehicleId: string, status: Vehicle["status"], startTimestamp?: number) => void;

  submitCrowdFeedback: (vehicleId: string, level: CrowdLevel) => void;

  createReminder: (reminder: Omit<Reminder, "id" | "userId" | "notified" | "createdAt">) => void;
  markReminderNotified: (reminderId: string) => void;
  removeReminder: (reminderId: string) => void;

  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  userRole: null,
  routes: MOCK_ROUTES,
  vehicles: MOCK_VEHICLES,
  reminders: [],
  punctualityStats: MOCK_PUNCTUALITY_STATS,
  toasts: [],
  selectedRouteId: null,
  driverVehicleId: null,

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

  submitCrowdFeedback: (vehicleId, level) => {
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

  createReminder: (reminder) => {
    const id = Math.random().toString(36).slice(2, 10);
    const newReminder: Reminder = {
      ...reminder,
      id,
      userId: "anonymous",
      notified: false,
      createdAt: Date.now(),
    };
    set((state) => ({ reminders: [...state.reminders, newReminder] }));
    get().addToast({ type: "info", message: "到站提醒已开启", duration: 3000 });
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
}));
