import { useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import { getPositionOnPath, getCurrentStationIndex } from "@/utils/geometry";
import type { Route, Vehicle } from "@shared/types";

const PROGRESS_INCREMENT_PER_TICK = 0.008;
const TICK_INTERVAL_MS = 2000;

export const useVehicleSimulation = () => {
  const routes = useAppStore((s) => s.routes);
  const vehicles = useAppStore((s) => s.vehicles);
  const updateVehicleProgress = useAppStore((s) => s.updateVehicleProgress);
  const addToast = useAppStore((s) => s.addToast);
  const reminders = useAppStore((s) => s.reminders);
  const markReminderNotified = useAppStore((s) => s.markReminderNotified);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const routeMap = new Map<string, Route>();
    routes.forEach((r) => routeMap.set(r.id, r));

    const tick = () => {
      const currentVehicles = useAppStore.getState().vehicles;
      currentVehicles.forEach((vehicle: Vehicle) => {
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
        currentReminders.forEach((rem) => {
          if (rem.notified || rem.vehicleId !== vehicle.id) return;
          const station = route.stations.find((s) => s.id === rem.stationId);
          if (!station) return;
          const stationIndexMatch = route.stations.findIndex((s) => s.id === rem.stationId);
          if (stationIndexMatch >= 0 && stationIndex >= stationIndexMatch) {
            markReminderNotified(rem.id);
            addToast({
              type: "success",
              message: `🔔 ${station.name} 站即将到达！请准备下车`,
              duration: 5000,
            });
          }
        });
      });
    };

    timerRef.current = window.setInterval(tick, TICK_INTERVAL_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes.length]);

  return { vehicles };
};
