import { useState } from "react";
import { formatCount } from "../data/journeyPlans";
import { getPassagesGrowth } from "../data/progress";
import AppIcon from "./AppIcon";

// Home "always going up" card (Kathy, review call 3): grey bars = steps each day (they go up and down),
// teal line = verses read so far (it only ever climbs) — "Your steps may vary. Your scripture never does."
// Closed by default (keeps Home short); the eye button opens the chart and replays its animation.
const WIDTH = 300;
const BASE = 96; // chart floor (viewBox y)
const TOP = 16; // highest point of the verse line

export default function PassagesGrowthChart() {
  const points = getPassagesGrowth();
  const total = points[points.length - 1]?.total ?? 0;
  const firstTotal = points.find((point) => point.total > 0)?.total ?? 0;
  const maxSteps = Math.max(1, ...points.map((point) => point.steps ?? 0));
  const gap = points.length > 1 ? (WIDTH - 36) / (points.length - 1) : 0;
  const xAt = (index: number) => (points.length > 1 ? 18 + index * gap : WIDTH / 2);
  const yAt = (value: number) => BASE - (total ? (value / total) * (BASE - TOP) : 0);
  const line = points.map((point, index) => `${index ? "L" : "M"}${xAt(index).toFixed(1)} ${yAt(point.total).toFixed(1)}`).join(" ");
  const area = `${line} L${xAt(points.length - 1).toFixed(1)} ${BASE} L${xAt(0).toFixed(1)} ${BASE} Z`;
  const barWidth = Math.min(22, Math.max(6, gap * 0.42 || 22));
  const last = points[points.length - 1];
  const [open, setOpen] = useState(false);
  const growth = total > firstTotal ? `${(total / firstTotal).toFixed(1).replace(/\.0$/, "")}× since Day 1` : "";

  return (
    <section className={`passages-growth ${open ? "open" : ""}`}>
      <button
        className="passages-growth-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`${open ? "Hide" : "Show"} how your verses grow: ${formatCount(total)} verses read`}
      >
        <div>
          <span>VERSES READ · ALWAYS GOING UP</span>
          <strong>Your scripture keeps growing</strong>
          <small>{formatCount(total)} verses{growth ? ` · ${growth}` : ""}</small>
        </div>
        <i><AppIcon name={open ? "eyeOff" : "eye"} /></i>
      </button>

      {open && (
        <div className="passages-growth-body">
          <svg className="passages-growth-chart" viewBox={`0 0 ${WIDTH} 104`} aria-hidden="true">
            <defs>
              <linearGradient id="passages-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2a908f" stopOpacity=".32" />
                <stop offset="100%" stopColor="#2a908f" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[TOP, (TOP + BASE) / 2, BASE].map((y) => <line className="passages-grid" x1="0" x2={WIDTH} y1={y} y2={y} key={y} />)}
            {points.map((point, index) => point.steps ? (
              <rect
                className="passages-step-bar"
                x={xAt(index) - barWidth / 2}
                y={BASE - (point.steps / maxSteps) * 46}
                width={barWidth}
                height={(point.steps / maxSteps) * 46}
                rx="3"
                style={{ animationDelay: `${index * 0.06}s` }}
                key={point.day}
              />
            ) : null)}
            <path className="passages-area" d={area} />
            <path className="passages-line" d={line} pathLength={100} />
            {points.map((point, index) => (
              <circle
                className={`passages-dot ${index === points.length - 1 ? "last" : ""} ${point.complete ? "" : "flat"}`}
                cx={xAt(index)}
                cy={yAt(point.total)}
                r={index === points.length - 1 ? 4.5 : 3}
                style={{ animationDelay: `${0.5 + index * 0.08}s` }}
                key={point.day}
              />
            ))}
          </svg>

          <div className="passages-growth-days" style={{ gridTemplateColumns: `repeat(${points.length}, 1fr)` }}>
            {points.map((point) => (
              <span className={point.status} key={point.day}>
                <b>{point.complete ? `+${formatCount(point.total - (points[point.day - 2]?.total ?? 0))}` : point.status === "missed" ? "—" : "·"}</b>
                Day {point.day}
              </span>
            ))}
          </div>

          <div className="passages-growth-legend">
            <span><i className="steps" />Steps each day</span>
            <span><i className="verses" />Verses read, all together</span>
          </div>
          <p className="passages-growth-note">
            {last && !last.complete ? "Complete today's reading and watch your line climb." : "Every verse you read stays with you — this line never goes down."}
          </p>
        </div>
      )}
    </section>
  );
}
