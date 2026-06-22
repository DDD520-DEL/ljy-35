import type {
  Route,
  Vehicle,
  Reminder,
  PushRecord,
  User,
  PushStatus,
  PushChannel,
  CheckInRecord,
  RideStats,
  ActiveTrip,
} from "@shared/types";
import { MOCK_ROUTES, MOCK_VEHICLES } from "../../src/data/mockData.js";

class DataStore {
  private routes: Route[] = MOCK_ROUTES;
  private vehicles: Vehicle[] = JSON.parse(JSON.stringify(MOCK_VEHICLES));
  private reminders: Reminder[] = [];
  private pushRecords: PushRecord[] = [];
  private users: User[] = [];
  private sentDedupeKeys = new Set<string>();
  private checkInRecords: CheckInRecord[] = [];
  private activeTrips: Map<string, ActiveTrip> = new Map();
  private qrTokens: Map<string, { vehicleId: string; tripId: string; expiresAt: number }> = new Map();

  getRoutes(): Route[] {
    return this.routes;
  }

  getRouteById(id: string): Route | undefined {
    return this.routes.find((r) => r.id === id);
  }

  getVehicles(): Vehicle[] {
    return this.vehicles;
  }

  getVehicleById(id: string): Vehicle | undefined {
    return this.vehicles.find((v) => v.id === id);
  }

  getVehiclesByRoute(routeId: string): Vehicle[] {
    return this.vehicles.filter((v) => v.routeId === routeId);
  }

  updateVehicleProgress(
    vehicleId: string,
    progress: number,
    position: { x: number; y: number },
    stationIndex: number
  ): void {
    this.vehicles = this.vehicles.map((v) =>
      v.id === vehicleId
        ? {
            ...v,
            progress,
            position,
            currentStationIndex: stationIndex,
            lastReportTime: Date.now(),
          }
        : v
    );
  }

  getReminders(): Reminder[] {
    return this.reminders;
  }

  getRemindersByUser(userId: string): Reminder[] {
    return this.reminders.filter((r) => r.userId === userId);
  }

  getActiveRemindersByVehicle(vehicleId: string): Reminder[] {
    return this.reminders.filter(
      (r) => r.vehicleId === vehicleId && !r.notified && r.pushStatus !== "cancelled"
    );
  }

  getReminderById(id: string): Reminder | undefined {
    return this.reminders.find((r) => r.id === id);
  }

  createReminder(data: Omit<Reminder, "id" | "createdAt" | "notified" | "pushStatus"> & {
    pushChannel?: PushChannel;
    triggerThreshold?: number;
  }): Reminder {
    const existing = this.reminders.find(
      (r) =>
        r.userId === data.userId &&
        r.vehicleId === data.vehicleId &&
        r.stationId === data.stationId &&
        !r.notified &&
        r.pushStatus !== "cancelled"
    );
    if (existing) {
      return existing;
    }

    const reminder: Reminder = {
      id: this.generateId("rem"),
      routeId: data.routeId,
      vehicleId: data.vehicleId,
      stationId: data.stationId,
      userId: data.userId,
      notified: false,
      pushStatus: "pending",
      pushChannel: data.pushChannel ?? "wechat_template",
      triggerThreshold: data.triggerThreshold ?? 1,
      createdAt: Date.now(),
    };
    this.reminders.push(reminder);
    return reminder;
  }

  updateReminder(id: string, updates: Partial<Reminder>): Reminder | undefined {
    const idx = this.reminders.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.reminders[idx] = { ...this.reminders[idx], ...updates };
    return this.reminders[idx];
  }

  markReminderNotified(id: string): Reminder | undefined {
    return this.updateReminder(id, {
      notified: true,
      triggeredAt: Date.now(),
    });
  }

  cancelReminder(id: string): Reminder | undefined {
    return this.updateReminder(id, {
      notified: true,
      pushStatus: "cancelled",
    });
  }

  removeReminder(id: string): boolean {
    const before = this.reminders.length;
    this.reminders = this.reminders.filter((r) => r.id !== id);
    return this.reminders.length < before;
  }

  getPushRecords(): PushRecord[] {
    return this.pushRecords;
  }

  getPushRecordsByReminder(reminderId: string): PushRecord[] {
    return this.pushRecords.filter((p) => p.reminderId === reminderId);
  }

  getPendingPushRecords(): PushRecord[] {
    return this.pushRecords.filter(
      (p) =>
        (p.status === "pending" || p.status === "failed") &&
        p.retryCount < p.maxRetries &&
        (!p.nextRetryAt || p.nextRetryAt <= Date.now())
    );
  }

  createPushRecord(data: Omit<PushRecord, "id" | "createdAt" | "updatedAt" | "retryCount" | "status"> & {
    status?: PushStatus;
    retryCount?: number;
  }): PushRecord {
    const record: PushRecord = {
      id: this.generateId("push"),
      reminderId: data.reminderId,
      userId: data.userId,
      channel: data.channel,
      status: data.status ?? "pending",
      retryCount: data.retryCount ?? 0,
      maxRetries: data.maxRetries,
      nextRetryAt: data.nextRetryAt,
      lastError: data.lastError,
      payload: data.payload,
      sentAt: data.sentAt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.pushRecords.push(record);
    return record;
  }

  updatePushRecord(id: string, updates: Partial<PushRecord>): PushRecord | undefined {
    const idx = this.pushRecords.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.pushRecords[idx] = {
      ...this.pushRecords[idx],
      ...updates,
      updatedAt: Date.now(),
    };
    return this.pushRecords[idx];
  }

  hasDedupeKey(key: string): boolean {
    return this.sentDedupeKeys.has(key);
  }

  addDedupeKey(key: string): void {
    this.sentDedupeKeys.add(key);
  }

  buildDedupeKey(reminderId: string, vehicleId: string, stationId: string): string {
    return `push:${reminderId}:${vehicleId}:${stationId}`;
  }

  getOrCreateUser(userId: string, openid?: string): User {
    let user = this.users.find((u) => u.id === userId);
    if (!user) {
      user = {
        id: userId,
        openid,
        createdAt: Date.now(),
      };
      this.users.push(user);
    } else if (openid && !user.openid) {
      user.openid = openid;
    }
    return user;
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  cleanExpiredDedupeKeys(maxAgeMs = 24 * 60 * 60 * 1000): void {
    const threshold = Date.now() - maxAgeMs;
    const keysToRemove: string[] = [];
    this.pushRecords.forEach((r) => {
      if (r.updatedAt < threshold && (r.status === "success" || r.status === "cancelled")) {
        const key = `push:${r.reminderId}`;
        this.sentDedupeKeys.forEach((k) => {
          if (k.startsWith(key)) keysToRemove.push(k);
        });
      }
    });
    keysToRemove.forEach((k) => this.sentDedupeKeys.delete(k));
  }

  startTrip(vehicleId: string, routeId: string, startStationId: string): ActiveTrip {
    const tripId = this.generateId("trip");
    const trip: ActiveTrip = {
      id: tripId,
      vehicleId,
      routeId,
      startTime: Date.now(),
      startStationId,
      currentStationIndex: 0,
      passengerCount: 0,
      checkInRecords: [],
    };
    this.activeTrips.set(vehicleId, trip);
    return trip;
  }

  endTrip(vehicleId: string): ActiveTrip | undefined {
    const trip = this.activeTrips.get(vehicleId);
    if (trip) {
      trip.checkInRecords.forEach((record) => {
        if (record.status === "active") {
          record.status = "completed";
        }
      });
      this.activeTrips.delete(vehicleId);
    }
    return trip;
  }

  getActiveTrip(vehicleId: string): ActiveTrip | undefined {
    return this.activeTrips.get(vehicleId);
  }

  updateTripStation(vehicleId: string, stationIndex: number): void {
    const trip = this.activeTrips.get(vehicleId);
    if (trip) {
      trip.currentStationIndex = stationIndex;
    }
  }

  generateQRToken(vehicleId: string, stationId: string): { token: string; tripId: string; expiresAt: number } {
    let trip = this.activeTrips.get(vehicleId);
    if (!trip) {
      const vehicle = this.getVehicleById(vehicleId);
      if (!vehicle) throw new Error("Vehicle not found");
      trip = this.startTrip(vehicleId, vehicle.routeId, stationId);
    }
    const token = this.generateId("qr");
    const expiresAt = Date.now() + 60 * 1000;
    this.qrTokens.set(token, { vehicleId, tripId: trip.id, expiresAt });
    return { token, tripId: trip.id, expiresAt };
  }

  validateQRToken(token: string): { vehicleId: string; tripId: string } | null {
    const tokenData = this.qrTokens.get(token);
    if (!tokenData) return null;
    if (tokenData.expiresAt < Date.now()) {
      this.qrTokens.delete(token);
      return null;
    }
    return { vehicleId: tokenData.vehicleId, tripId: tokenData.tripId };
  }

  cleanExpiredQRTokens(): void {
    const now = Date.now();
    this.qrTokens.forEach((data, token) => {
      if (data.expiresAt < now) {
        this.qrTokens.delete(token);
      }
    });
  }

  checkIn(userId: string, token: string): CheckInRecord | null {
    const tokenData = this.validateQRToken(token);
    if (!tokenData) return null;

    const trip = this.activeTrips.get(tokenData.vehicleId);
    if (!trip) return null;

    const vehicle = this.getVehicleById(tokenData.vehicleId);
    if (!vehicle) return null;

    const existingCheckIn = trip.checkInRecords.find(
      (r) => r.userId === userId && r.status === "active"
    );
    if (existingCheckIn) return existingCheckIn;

    const route = this.getRouteById(vehicle.routeId);
    const currentStation = route?.stations[trip.currentStationIndex];

    const record: CheckInRecord = {
      id: this.generateId("ci"),
      userId,
      vehicleId: tokenData.vehicleId,
      routeId: vehicle.routeId,
      stationId: currentStation?.id ?? trip.startStationId,
      checkInTime: Date.now(),
      tripId: trip.id,
      status: "active",
    };

    this.checkInRecords.push(record);
    trip.checkInRecords.push(record);
    trip.passengerCount = trip.checkInRecords.filter((r) => r.status === "active").length;

    const totalPassengers = trip.passengerCount;
    if (totalPassengers > 0) {
      const capacity = 30;
      const crowdRatio = totalPassengers / capacity;
      let crowdLevel: "loose" | "normal" | "crowded" = "normal";
      if (crowdRatio < 0.4) crowdLevel = "loose";
      else if (crowdRatio > 0.7) crowdLevel = "crowded";

      const veh = this.vehicles.find((v) => v.id === tokenData.vehicleId);
      if (veh) {
        veh.crowdLevel = crowdLevel;
      }
    }

    return record;
  }

  getCheckInRecords(filters?: {
    userId?: string;
    vehicleId?: string;
    routeId?: string;
    date?: string;
  }): CheckInRecord[] {
    let result = [...this.checkInRecords];
    if (filters?.userId) {
      result = result.filter((r) => r.userId === filters.userId);
    }
    if (filters?.vehicleId) {
      result = result.filter((r) => r.vehicleId === filters.vehicleId);
    }
    if (filters?.routeId) {
      result = result.filter((r) => r.routeId === filters.routeId);
    }
    if (filters?.date) {
      const dateStart = new Date(filters.date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(filters.date);
      dateEnd.setHours(23, 59, 59, 999);
      result = result.filter(
        (r) => r.checkInTime >= dateStart.getTime() && r.checkInTime <= dateEnd.getTime()
      );
    }
    return result;
  }

  getRideStats(date: string, routeId?: string): RideStats[] {
    const routes = routeId
      ? [this.getRouteById(routeId)].filter(Boolean) as Route[]
      : this.routes;

    return routes.map((route) => {
      const records = this.getCheckInRecords({ date, routeId: route.id });
      const uniqueUsers = new Set(records.map((r) => r.userId));

      const hourlyData: { hour: number; count: number }[] = [];
      for (let h = 0; h < 24; h++) {
        const hourRecords = records.filter((r) => {
          const d = new Date(r.checkInTime);
          return d.getHours() === h;
        });
        hourlyData.push({ hour: h, count: hourRecords.length });
      }

      const peakHour = hourlyData.reduce(
        (max, d) => (d.count > max.count ? d : max),
        { hour: 0, count: 0 }
      ).hour;

      const stationData = route.stations.map((station) => ({
        stationId: station.id,
        stationName: station.name,
        count: records.filter((r) => r.stationId === station.id).length,
      }));

      return {
        date,
        routeId: route.id,
        routeName: route.name,
        totalRides: records.length,
        uniquePassengers: uniqueUsers.size,
        peakHour,
        hourlyData,
        stationData,
      };
    });
  }

  getUserActiveCheckIn(userId: string): CheckInRecord | undefined {
    return this.checkInRecords.find(
      (r) => r.userId === userId && r.status === "active"
    );
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

export const dataStore = new DataStore();
