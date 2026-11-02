import { cn } from "../ui/utils";
import { useMediaQuery } from "../../hooks/useMediaQuery";

interface HeroArtworkProps {
  /** Origin label drawn at the start of the route, e.g. "SEOUL". */
  from: string;
  /** Destination label drawn at the end of the route, e.g. "MOSCOW". */
  to: string;
  /** Parks the parcel mid-route. The CSS animations are stilled by the global reduced-motion rule. */
  reducedMotion?: boolean;
  className?: string;
}

/*
  Original artwork for the landing hero: a graticule globe, a dotted route from Seoul to Moscow
  and one parcel travelling along it. Everything is drawn in a 2000 x 1600 box and sliced to the
  hero, so the route, its labels and the parcel stay inside x 500-1500 / y 450-720: the part of
  the box that survives a phone (portrait crop) and an ultra-wide desktop (letterbox crop), and
  that sits above the headline block at the bottom of the hero. Phones look at the box 150 units
  higher (viewBox offset) because their headline block takes most of the hero.
*/
const VIEW_BOX = "0 0 2000 1600";
const VIEW_BOX_COMPACT = "0 150 2000 1600";
const ROUTE = "M 600 620 C 760 470, 1140 400, 1440 500";
const ORIGIN = { x: 600, y: 620, coords: "37.57° N  126.98° E" };
const DESTINATION = { x: 1440, y: 500, coords: "55.76° N  37.62° E" };
/** Point on the route (t = 0.45) where the parcel rests when motion is reduced. */
const PARCEL_REST = { x: 922, y: 474 };
const GLOBE = { cx: 1380, cy: 740, r: 640 };

/** Meridians (tall ellipses) and parallels (flat ones) of an orthographic globe, every 30 degrees. */
function Graticule() {
  const { cx, cy, r } = GLOBE;
  const sin30 = 0.5;
  const sin60 = 0.866;
  const tilt = 0.16;
  const line = "stroke-white";
  return (
    <g transform={`rotate(-18 ${cx} ${cy})`} fill="none" strokeWidth={1} vectorEffect="non-scaling-stroke">
      <circle cx={cx} cy={cy} r={r} className={line} strokeOpacity={0.22} />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} className={line} strokeOpacity={0.1} />
      <ellipse cx={cx} cy={cy} rx={r * sin30} ry={r} className={line} strokeOpacity={0.1} />
      <ellipse cx={cx} cy={cy} rx={r * sin60} ry={r} className={line} strokeOpacity={0.1} />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} className={line} strokeOpacity={0.1} />
      {[-1, 1].map((sign) => (
        <g key={sign}>
          <ellipse cx={cx} cy={cy + sign * r * sin30} rx={r * sin60} ry={r * sin60 * tilt} className={line} strokeOpacity={0.1} />
          <ellipse cx={cx} cy={cy + sign * r * sin60} rx={r * sin30} ry={r * sin30 * tilt} className={line} strokeOpacity={0.1} />
        </g>
      ))}
    </g>
  );
}

/** A dot with a thin ring pinging out of it. */
function Marker({ x, y, delay }: { x: number; y: number; delay?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle
        r={6}
        fill="none"
        stroke="#ffffff"
        strokeWidth={0.6}
        className="origin-center [transform-box:fill-box] [--pulse-from:1.9] md:[--pulse-from:1] animate-hero-pulse"
        style={delay ? { animationDelay: delay } : undefined}
      />
      <circle r={6} className="origin-center scale-[1.9] fill-white [transform-box:fill-box] md:scale-100" />
    </g>
  );
}

/**
 * City name and coordinates under a marker. Sizes are responsive so they read on a phone too;
 * on short phones (hero-label) they step aside for the headline.
 */
function Label({ x, y, name, coords, anchor }: { x: number; y: number; name: string; coords: string; anchor: "start" | "end" }) {
  return (
    <g textAnchor={anchor} className="hero-label fill-white">
      <text x={x} y={y + 48} className="text-[34px] font-medium tracking-[0.22em] md:text-[19px]" fillOpacity={0.92}>
        {name}
      </text>
      <text x={x} y={y + 82} className="text-[22px] tracking-[0.1em] figure md:text-[13px]" fillOpacity={0.55}>
        {coords}
      </text>
    </g>
  );
}

export function HeroArtwork({ from, to, reducedMotion = false, className }: HeroArtworkProps) {
  const compact = useMediaQuery("(max-width: 767px)");
  return (
    <svg
      viewBox={compact ? VIEW_BOX_COMPACT : VIEW_BOX}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      data-hero-art=""
      className={cn("block bg-[#0a0a0a]", className)}
    >
      <defs>
        <radialGradient id="hero-glow" cx="0.7" cy="0.45" r="0.55">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="hero-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <path id="hero-route" d={ROUTE} />
      </defs>

      {/* Depth: a soft glow behind the globe, then film grain over everything */}
      <rect width="2000" height="1600" fill="url(#hero-glow)" />
      <Graticule />
      <rect width="2000" height="1600" filter="url(#hero-grain)" opacity="0.07" />

      {/* The route: a hairline track and a stream of dots flowing from origin to destination */}
      <use href="#hero-route" fill="none" stroke="#ffffff" strokeOpacity={0.3} strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
      <use
        href="#hero-route"
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.85}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeDasharray="4 14"
        className="animate-hero-route"
      />

      <Marker x={ORIGIN.x} y={ORIGIN.y} />
      <Marker x={DESTINATION.x} y={DESTINATION.y} delay="1.6s" />

      {/* The parcel. SMIL moves the outer group along the route; the inner one keeps it 16px on any screen. */}
      <g transform={reducedMotion ? `translate(${PARCEL_REST.x} ${PARCEL_REST.y})` : undefined}>
        {reducedMotion ? null : (
          <animateMotion dur="14s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.06;0.86;1">
            <mpath href="#hero-route" />
          </animateMotion>
        )}
        <g className="origin-center scale-[1.9] [transform-box:fill-box] md:scale-100">
          <circle r={22} fill="#ffffff" fillOpacity={0.08} />
          <rect x={-11} y={-11} width={22} height={22} fill="#0a0a0a" stroke="#ffffff" strokeWidth={1.6} />
          <line x1={0} y1={-11} x2={0} y2={11} stroke="#ffffff" strokeOpacity={0.7} strokeWidth={1.2} />
        </g>
      </g>

      <Label x={ORIGIN.x} y={ORIGIN.y} name={from} coords={ORIGIN.coords} anchor="start" />
      <Label x={DESTINATION.x} y={DESTINATION.y} name={to} coords={DESTINATION.coords} anchor="end" />
    </svg>
  );
}
