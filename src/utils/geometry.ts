import type { Point, Route, Station, CrowdLevel } from "@shared/types";

export const getDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const getTotalPathLength = (points: Point[]): number => {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += getDistance(points[i - 1], points[i]);
  }
  return total;
};

export const getPositionOnPath = (points: Point[], progress: number): Point => {
  if (points.length < 2) return points[0] || { x: 0, y: 0 };
  const clamped = Math.max(0, Math.min(1, progress));
  const totalLength = getTotalPathLength(points);
  const targetDistance = totalLength * clamped;

  let traveled = 0;
  for (let i = 1; i < points.length; i++) {
    const segLen = getDistance(points[i - 1], points[i]);
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
};

export const getCurrentStationIndex = (
  stations: Station[],
  points: Point[],
  progress: number
): number => {
  if (stations.length === 0) return 0;
  const totalLength = getTotalPathLength(points);
  const targetDistance = totalLength * progress;

  let stationIndex = 0;
  let minDelta = Infinity;

  for (let i = 0; i < stations.length; i++) {
    const stationDist = getDistanceToPoint(points, stations[i]);
    const delta = targetDistance - stationDist;
    if (delta >= 0 && delta < minDelta) {
      minDelta = delta;
      stationIndex = i;
    }
  }
  return stationIndex;
};

const getDistanceToPoint = (points: Point[], target: Point): number => {
  const totalLength = getTotalPathLength(points);
  let bestDist = Infinity;
  let traveled = 0;

  for (let i = 1; i < points.length; i++) {
    const segLen = getDistance(points[i - 1], points[i]);
    const segDist = pointToSegmentDistance(target, points[i - 1], points[i]);
    if (segDist < bestDist) {
      bestDist = segDist;
    }
    traveled += segLen;
  }

  traveled = 0;
  for (let i = 1; i < points.length; i++) {
    const segLen = getDistance(points[i - 1], points[i]);
    const t = projectionFactor(target, points[i - 1], points[i]);
    if (t >= 0 && t <= 1) {
      return traveled + segLen * t;
    }
    traveled += segLen;
  }
  return totalLength / 2;
};

const pointToSegmentDistance = (p: Point, a: Point, b: Point): number => {
  const t = projectionFactor(p, a, b);
  if (t < 0) return getDistance(p, a);
  if (t > 1) return getDistance(p, b);
  return getDistance(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
};

const projectionFactor = (p: Point, a: Point, b: Point): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return 0;
  return ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
};

export const calculateETA = (
  route: Route,
  currentStationIndex: number,
  currentProgress: number,
  targetStationIndex: number,
  avgMinutesPerStation = 3
): number => {
  if (targetStationIndex < currentStationIndex) return -1;
  const progressPerStation = 1 / Math.max(1, route.stations.length - 1);
  const currentFloatStation = currentProgress / progressPerStation;
  const remaining = Math.max(0, targetStationIndex - currentFloatStation);
  return Math.max(0, Math.round(remaining * avgMinutesPerStation));
};

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const getCrowdColor = (level: CrowdLevel): string => {
  switch (level) {
    case "loose":
      return "#10B981";
    case "normal":
      return "#F59E0B";
    case "crowded":
      return "#F43F5E";
  }
};

export const getCrowdText = (level: CrowdLevel): string => {
  switch (level) {
    case "loose":
      return "宽松";
    case "normal":
      return "适中";
    case "crowded":
      return "拥挤";
  }
};

export const generateUID = (): string => {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
};

export const buildSvgPath = (points: Point[]): string => {
  if (points.length === 0) return "";
  return (
    `M ${points[0].x} ${points[0].y} ` +
    points
      .slice(1)
      .map((p) => `L ${p.x} ${p.y}`)
      .join(" ")
  );
};
