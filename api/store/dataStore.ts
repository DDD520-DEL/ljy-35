import type {
  Route,
  Vehicle,
  Reminder,
  PushRecord,
  User,
  PushStatus,
  PushChannel,
} from "@shared/types";
import { MOCK_ROUTES, MOCK_VEHICLES } from "../../src/data/mockData.js";

class DataStore {
  private routes: Route[] = MOCK_ROUTES;
  private vehicles: Vehicle[] = JSON.parse(JSON.stringify(MOCK_VEHICLES));
  private reminders: Reminder[] = [];
  private pushRecords: PushRecord[] = [];
  private users: User[] = [];
  private sentDedupeKeys = new Set<string>();

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

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

export const dataStore = new DataStore();
