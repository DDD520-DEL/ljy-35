import { useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import { getPositionOnPath, getCurrentStationIndex } from "@/utils/geometry";
import type { Route, Vehicle, Reminder } from "@shared/types";

const PROGRESS_INCREMENT_PER_TICK = 0.008;
const TICK_INTERVAL_MS = 2000;

let nextTimerId: number | null = null;
let isInitialized = false;
const lastNotifiedToastReminders = new Set<string>();

export const startVehicleSimulation = () => {
  if (isInitialized) return;
  isInitialized = true;

  const tick = () => {
    try {
      const state = useAppStore.getState();
      const { routes, vehicles, updateVehicleProgress, addToast, markReminderNotified } = state;

      const routeMap = new Map<string, Route>();
      routes.forEach((r) => routeMap.set(r.id, r));

      vehicles.forEach((vehicle: Vehicle) => {
        if (vehicle.status !== "running") return;
        const route = routeMap.get(vehicle.routeId);
        if (!route) return;

        let nextProgress = vehicle.progress + PROGRESS_INCREMENT_PER_TICK;
        let looped = false;
        if (nextProgress >= 1) {
          nextProgress = 0;
          looped = true;
        }

        const position = getPositionOnPath(route.pathPoints, nextProgress);
        const stationIndex = getCurrentStationIndex(route.stations, route.pathPoints, nextProgress);
        updateVehicleProgress(vehicle.id, nextProgress, position, stationIndex);

        if (looped) {
          addToast({
            type: "info",
            message: `${route.name} 班车 ${vehicle.plateNumber} 已回到起点`,
            duration: 3500,
          });
        }

        const currentReminders = useAppStore.getState().reminders;
        currentReminders.forEach((rem: Reminder) => {
          if (rem.notified || rem.vehicleId !== vehicle.id) return;
          const station = route.stations.find((s) => s.id === rem.stationId);
          if (!station) return;
          const stationIndexMatch = route.stations.findIndex((s) => s.id === rem.stationId);
          if (stationIndexMatch >= 0 && stationIndex >= stationIndexMatch) {
            markReminderNotified(rem.id);

            if (rem.pushStatus === "success" && !lastNotifiedToastReminders.has(rem.id)) {
              lastNotifiedToastReminders.add(rem.id);
              addToast({
                type: "success",
                message: `🔔 微信通知已发送：${station.name} 站即将到达！`,
                duration: 5000,
              });
            } else if (
              (rem.pushStatus === "pending" || rem.pushStatus === "failed" || rem.pushStatus === "sending") &&
              !lastNotifiedToastReminders.has(rem.id)
            ) {
              lastNotifiedToastReminders.add(rem.id);
              addToast({
                type: "info",
                message: `🔔 ${station.name} 站即将到达！微信通知推送中...`,
                duration: 5000,
              });
            }
          }
        });
      });
    } catch (err) {
      console.error("[VehicleSim] tick error:", err);
    } finally {
      nextTimerId = window.setTimeout(tick, TICK_INTERVAL_MS);
    }
  };

  nextTimerId = window.setTimeout(tick, TICK_INTERVAL_MS);
};

export const useVehicleSimulation = () => {
  const vehicles = useAppStore((s) => s.vehicles);
  const syncFromServer = useAppStore((s) => s.syncFromServer);
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    syncFromServer().catch((err) => console.warn("[VehicleSim] initial sync failed:", err));

    startVehicleSimulation();
  }, [syncFromServer]);

  void nextTimerId;
  return { vehicles };
};
