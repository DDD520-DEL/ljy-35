export type CrowdLevel = "loose" | "normal" | "crowded";

export type VehicleStatus = "idle" | "running" | "arrived";

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

export interface Reminder {
  id: string;
  routeId: string;
  vehicleId: string;
  stationId: string;
  userId: string;
  notified: boolean;
  createdAt: number;
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
