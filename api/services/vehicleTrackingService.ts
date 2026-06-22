import type { Route, Vehicle, Point } from "@shared/types";
import { dataStore } from "../store/dataStore.js";
import { wechatPushService } from "./wechatPushService.js";

const PROGRESS_INCREMENT_PER_TICK = 0.008;
const TICK_INTERVAL_MS = 2000;

export class VehicleTrackingService {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.tick();
    console.log("[VehicleTrackingService] Service started");
  }

  stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log("[VehicleTrackingService] Service stopped");
  }

  private tick = (): void => {
    if (!this.isRunning) return;

    try {
      const routes = dataStore.getRoutes();
      const vehicles = dataStore.getVehicles();

      const routeMap = new Map<string, Route>();
      routes.forEach((r) => routeMap.set(r.id, r));

      vehicles.forEach((vehicle) => {
        if (vehicle.status !== "running") return;

        const route = routeMap.get(vehicle.routeId);
        if (!route) return;

        let nextProgress = vehicle.progress + PROGRESS_INCREMENT_PER_TICK;
        if (nextProgress >= 1) {
          nextProgress = 0;
        }

        const position = this.getPositionOnPath(route.pathPoints, nextProgress);
        const stationIndex = this.getCurrentStationIndex(
          route.stations,
          route.pathPoints,
          nextProgress
        );

        dataStore.updateVehicleProgress(vehicle.id, nextProgress, position, stationIndex);

        this.checkRemindersForVehicle(vehicle, route, stationIndex);
      });
    } catch (err) {
      console.error("[VehicleTrackingService] tick error:", err);
    }

    this.timer = setTimeout(this.tick, TICK_INTERVAL_MS);
  };

  private checkRemindersForVehicle(
    vehicle: Vehicle,
    route: Route,
    _currentStationIndex: number
  ): void {
    void _currentStationIndex;
    const reminders = dataStore.getActiveRemindersByVehicle(vehicle.id);

    reminders.forEach((reminder) => {
      if (reminder.pushStatus === "success" || reminder.pushStatus === "sending") return;

      const targetStationIdx = route.stations.findIndex(
        (s) => s.id === reminder.stationId
      );
      if (targetStationIdx < 0) return;

      const progressPerStation = 1 / Math.max(1, route.stations.length - 1);
      const currentFloatStation = vehicle.progress / progressPerStation;

      const distanceToTarget = targetStationIdx - currentFloatStation;

      if (distanceToTarget <= reminder.triggerThreshold && distanceToTarget >= -0.5) {
        if (reminder.pushStatus === "pending" || reminder.pushStatus === "failed") {
          console.log(
            `[VehicleTrackingService] Triggering push for reminder ${reminder.id}: ` +
              `vehicle=${vehicle.id}, targetStation=${route.stations[targetStationIdx]?.name}, ` +
              `distance=${distanceToTarget.toFixed(2)} stations`
          );

          wechatPushService.triggerReminderPush(reminder).catch((err) => {
            console.error(
              `[VehicleTrackingService] Failed to trigger push for reminder ${reminder.id}:`,
              err
            );
          });
        }
      }
    });
  }

  private getPositionOnPath(points: Point[], progress: number): Point {
    if (points.length < 2) return points[0] || { x: 0, y: 0 };
    const clamped = Math.max(0, Math.min(1, progress));
    const totalLength = this.getTotalPathLength(points);
    const targetDistance = totalLength * clamped;

    let traveled = 0;
    for (let i = 1; i < points.length; i++) {
      const segLen = this.getDistance(points[i - 1], points[i]);
      if (traveled + segLen >= targetDistance) {
        const segProgress = segLen === 0 ? 0 : (targetDistance - traveled) / segLen;
        return {
          x: points[i - 1].x + (points[i].x - points[i - 1].x) * segProgress,
          y: points[i - 1].y + (points[i].y - points[i - 1].y) * segProgress,
        };
      }
      traveled += segLen;
    }
    return points[points.length - 1];
  }

  private getTotalPathLength(points: Point[]): number {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += this.getDistance(points[i - 1], points[i]);
    }
    return total;
  }

  private getDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  private getCurrentStationIndex(
    stations: { index: number; x: number; y: number }[],
    pathPoints: Point[],
    progress: number
  ): number {
    if (stations.length === 0) return 0;
    const totalLength = this.getTotalPathLength(pathPoints);
    const targetDistance = totalLength * progress;

    let stationIndex = 0;
    let minDelta = Infinity;

    for (const station of stations) {
      const stationDist = this.getDistanceToPointOnPath(pathPoints, {
        x: station.x,
        y: station.y,
      });
      const delta = targetDistance - stationDist;
      if (delta >= 0 && delta < minDelta) {
        minDelta = delta;
        stationIndex = station.index;
      }
    }
    return stationIndex;
  }

  private getDistanceToPointOnPath(points: Point[], target: Point): number {
    let traveled = 0;
    for (let i = 1; i < points.length; i++) {
      const segLen = this.getDistance(points[i - 1], points[i]);
      const t = this.projectionFactor(target, points[i - 1], points[i]);
      if (t >= 0 && t <= 1) {
        return traveled + segLen * t;
      }
      traveled += segLen;
    }
    return this.getTotalPathLength(points) / 2;
  }

  private projectionFactor(p: Point, a: Point, b: Point): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return 0;
    return ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  }
}

export const vehicleTrackingService = new VehicleTrackingService();
