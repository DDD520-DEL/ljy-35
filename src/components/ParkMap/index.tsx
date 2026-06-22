import { useMemo } from "react";
import { Bus, MapPin } from "lucide-react";
import type { Route, Vehicle } from "@shared/types";
import { buildSvgPath } from "@/utils/geometry";
import { cn } from "@/lib/utils";

interface ParkMapProps {
  routes: Route[];
  vehicles: Vehicle[];
  highlightRouteId?: string | null;
  onRouteClick?: (routeId: string) => void;
  className?: string;
}

const MAP_W = 960;
const MAP_H = 780;

const BUILDINGS = [
  { x: 60, y: 180, w: 140, h: 80, label: "设计中心" },
  { x: 340, y: 60, w: 160, h: 90, label: "总部大楼" },
  { x: 580, y: 170, w: 120, h: 70, label: "AI研究院" },
  { x: 180, y: 360, w: 150, h: 90, label: "研发大厦" },
  { x: 480, y: 380, w: 120, h: 80, label: "数据中心" },
  { x: 700, y: 400, w: 150, h: 90, label: "会议中心" },
  { x: 160, y: 640, w: 140, h: 80, label: "员工公寓" },
  { x: 600, y: 640, w: 160, h: 80, label: "体育馆" },
  { x: 360, y: 480, w: 110, h: 60, label: "员工餐厅" },
];

const TREES = [
  { x: 80, y: 320 }, { x: 320, y: 260 }, { x: 560, y: 280 }, { x: 820, y: 300 },
  { x: 90, y: 560 }, { x: 340, y: 700 }, { x: 540, y: 540 }, { x: 860, y: 560 },
  { x: 260, y: 140 }, { x: 780, y: 200 }, { x: 400, y: 320 }, { x: 680, y: 560 },
];

export default function ParkMap({
  routes,
  vehicles,
  highlightRouteId,
  onRouteClick,
  className,
}: ParkMapProps) {
  const pathData = useMemo(
    () => routes.map((r) => ({ id: r.id, d: buildSvgPath(r.pathPoints), color: r.color })),
    [routes]
  );

  const visibleVehicles = highlightRouteId
    ? vehicles.filter((v) => v.routeId === highlightRouteId)
    : vehicles;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl glass shadow-card",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#0C1A2E] via-[#0B1220] to-[#0A1628]" />
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="relative w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ minHeight: "500px", aspectRatio: `${MAP_W} / ${MAP_H}` }}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56,189,248,0.05)" strokeWidth="1" />
          </pattern>
          {routes.map((r) => (
            <linearGradient key={`grad-${r.id}`} id={`gradient-${r.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={r.color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={r.color} stopOpacity="0.5" />
            </linearGradient>
          ))}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />

        {BUILDINGS.map((b, i) => (
          <g key={`bld-${i}`}>
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx="8"
              fill="rgba(30,41,59,0.7)"
              stroke="rgba(148,163,184,0.2)"
              strokeWidth="1"
            />
            <rect
              x={b.x + 4}
              y={b.y + 4}
              width={b.w - 8}
              height={4}
              rx="2"
              fill="rgba(56,189,248,0.25)"
            />
            <text
              x={b.x + b.w / 2}
              y={b.y + b.h / 2 + 5}
              textAnchor="middle"
              fill="rgba(148,163,184,0.6)"
              fontSize="11"
              fontFamily="Inter, sans-serif"
              fontWeight="500"
            >
              {b.label}
            </text>
          </g>
        ))}

        {TREES.map((t, i) => (
          <g key={`tree-${i}`} transform={`translate(${t.x}, ${t.y})`}>
            <circle r="10" fill="rgba(16,185,129,0.25)" />
            <circle r="6" fill="rgba(16,185,129,0.45)" />
          </g>
        ))}

        {pathData.map((p) => {
          const isHighlighted = highlightRouteId === p.id || !highlightRouteId;
          return (
            <g key={p.id} className={cn(onRouteClick && "cursor-pointer")}>
              <path
                d={p.d}
                stroke={p.color}
                strokeWidth={isHighlighted ? 10 : 5}
                strokeOpacity={isHighlighted ? 0.18 : 0.08}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                onClick={() => onRouteClick?.(p.id)}
              />
              <path
                d={p.d}
                stroke={`url(#gradient-${p.id})`}
                strokeWidth={isHighlighted ? 4 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={isHighlighted ? "0" : "6 8"}
                filter={isHighlighted ? "url(#glow)" : undefined}
                onClick={() => onRouteClick?.(p.id)}
              />
            </g>
          );
        })}

        {routes.map((r) =>
          r.stations.map((s) => {
            const isHighlighted = highlightRouteId === r.id || !highlightRouteId;
            return (
              <g
                key={s.id}
                className="map-station"
                onClick={() => onRouteClick?.(r.id)}
              >
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={isHighlighted ? 10 : 7}
                  fill="#0B1220"
                  stroke={r.color}
                  strokeWidth={2}
                  opacity={isHighlighted ? 1 : 0.5}
                />
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={isHighlighted ? 5 : 3}
                  fill={r.color}
                  className={isHighlighted ? "animate-pulse-slow" : ""}
                />
                <text
                  x={s.x}
                  y={s.y + 26}
                  textAnchor="middle"
                  fill="rgba(226,232,240,0.75)"
                  fontSize="10.5"
                  fontFamily="Inter, sans-serif"
                  fontWeight={isHighlighted ? "600" : "400"}
                  opacity={isHighlighted ? 1 : 0.6}
                >
                  {s.name}
                </text>
              </g>
            );
          })
        )}

        {visibleVehicles.map((v) => {
          if (v.status !== "running") return null;
          const route = routes.find((r) => r.id === v.routeId);
          if (!route) return null;
          return (
            <g
              key={v.id}
              className="vehicle-icon"
              style={{
                transform: `translate(${v.position.x}px, ${v.position.y}px)`,
              }}
            >
              <circle r="20" fill={route.color} opacity="0.2">
                <animate attributeName="r" values="14;24;14" dur="2.2s" repeatCount="indefinite" />
                <animate
                  attributeName="opacity"
                  values="0.35;0;0.35"
                  dur="2.2s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle r="13" fill="#0B1220" stroke={route.color} strokeWidth="3" />
              <g transform="translate(-9, -9)">
                <Bus size={18} color={route.color} strokeWidth={2.2} />
              </g>
            </g>
          );
        })}

        <g transform="translate(20, 20)">
          <rect
            x="0"
            y="0"
            width="180"
            height={28 + routes.length * 22}
            rx="10"
            fill="rgba(11,18,32,0.8)"
            stroke="rgba(148,163,184,0.15)"
          />
          <text x="14" y="22" fill="rgba(226,232,240,0.9)" fontSize="12" fontWeight="600" fontFamily="Space Grotesk">
            线路图例
          </text>
          {routes.map((r, i) => (
            <g key={r.id} transform={`translate(14, ${38 + i * 22})`}>
              <rect width="18" height="4" rx="2" fill={r.color} y="3" />
              <text x="28" y="9" fill="rgba(203,213,225,0.8)" fontSize="11" fontFamily="Inter">
                {r.name}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
