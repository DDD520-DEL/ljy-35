export type CrowdLevel = "loose" | "normal" | "crowded";

export type VehicleStatus = "idle" | "running" | "arrived";

export type PushStatus = "pending" | "sending" | "success" | "failed" | "cancelled";

export type PushChannel = "wechat_template" | "sms" | "in_app";

export interface Point {
  x: number;
  y: number;
}

export interface Station {
  id: string;
  name: string;
  index: number;
  x: number;
  y: number;
  eta?: number;
}

export interface Route {
  id: string;
  name: string;
  shortName: string;
  color: string;
  description: string;
  stations: Station[];
  pathPoints: Point[];
  operatingHours: string;
  interval: number;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  routeId: string;
  driverName: string;
  status: VehicleStatus;
  progress: number;
  currentStationIndex: number;
  crowdLevel: CrowdLevel;
  crowdVotes: { loose: number; normal: number; crowded: number };
  position: Point;
  lastReportTime: number;
  startTimestamp?: number;
  speed: number;
}

export interface User {
  id: string;
  openid?: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
  createdAt: number;
}

export interface Reminder {
  id: string;
  routeId: string;
  vehicleId: string;
  stationId: string;
  userId: string;
  notified: boolean;
  pushStatus: PushStatus;
  pushChannel: PushChannel;
  triggerThreshold: number;
  triggeredAt?: number;
  createdAt: number;
}

export interface WechatTemplateConfig {
  appId: string;
  appSecret: string;
  templateId: string;
}

export interface WechatTemplateData {
  first: { value: string; color?: string };
  keyword1: { value: string; color?: string };
  keyword2: { value: string; color?: string };
  keyword3: { value: string; color?: string };
  keyword4?: { value: string; color?: string };
  remark: { value: string; color?: string };
}

export interface PushRecord {
  id: string;
  reminderId: string;
  userId: string;
  channel: PushChannel;
  status: PushStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: number;
  lastError?: string;
  payload: string;
  sentAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TripRecord {
  id: string;
  vehicleId: string;
  routeId: string;
  date: string;
  startTime: number;
  endTime: number;
  plannedDuration: number;
  actualDuration: number;
  stations: { stationId: string; actualArrival: number; plannedArrival: number }[];
}

export interface PunctualityStats {
  routeId: string;
  routeName: string;
  totalTrips: number;
  onTimeTrips: number;
  onTimeRate: number;
  averageDelay: number;
  dailyData: { date: string; rate: number }[];
}

export interface Toast {
  id: string;
  type: "success" | "info" | "warning" | "error";
  message: string;
  duration?: number;
}

export type UserRole = "passenger" | "driver" | "admin" | null;
