import { useEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  SKILL_EDGES,
  SKILL_NODES,
  type SkillCategory,
} from "../data/skillsGraph";

const NODE_RADIUS = 5;
const HOVER_PADDING = 11; // extra forgiveness around the visible dot
const HOVER_SPEED_FACTOR = 0.18; // how much drift keeps going while hovered (not zero)
const SPEED_EASE = 0.03;
const MIN_SPEED = 0.004; // px/ms
const MAX_SPEED = 0.013; // px/ms

const DIM_ALPHA_HOVER = 0.14; // node/edge not connected to the hovered node
const DIM_ALPHA_FILTER = 0.1; // node/edge excluded by the active category filter

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as SkillCategory[];

interface NodeState {
  id: string;
  label: string;
  category: SkillCategory;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speedFactor: number;
}

export default function SkillsGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<NodeState[]>([]);
  const hoveredRef = useRef<string | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const reduceMotionRef = useRef(false);
  const drawRef = useRef<(() => void) | null>(null);

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
    category: SkillCategory;
  } | null>(null);

  // Empty set = no filter, everything shown. Otherwise: only these categories are "in play".
  const [activeCategories, setActiveCategories] = useState<Set<SkillCategory>>(
    new Set(),
  );
  const activeCategoriesRef = useRef<Set<SkillCategory>>(new Set());
  useEffect(() => {
    activeCategoriesRef.current = activeCategories;
    if (reduceMotionRef.current) drawRef.current?.();
  }, [activeCategories]);

  const toggleCategory = (cat: SkillCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };
  const clearFilter = () => setActiveCategories(new Set());

  // Adjacency map (id -> set of directly connected ids), built once from the data.
  const neighborsById = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const n of SKILL_NODES) map.set(n.id, new Set());
    for (const e of SKILL_EDGES) {
      if (!map.has(e.from) || !map.has(e.to)) continue;
      map.get(e.from)!.add(e.to);
      map.get(e.to)!.add(e.from);
    }
    return map;
  }, []);

  // Deterministic-ish per-node pseudo-random helper so layout/velocity feel
  // organic (not synced) but reproducible across reloads of the same node set.
  const rand = (seed: number, offset: number) => {
    const v = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };

  // Scatter nodes evenly across the WHOLE container (a jittered grid, not
  // per-category zones), then give each an independent wander velocity.
  // This runs once, on first layout only — see the resize handler for what
  // happens after that.
  const seedNodes = (width: number, height: number) => {
    const count = SKILL_NODES.length;
    const cols = Math.max(1, Math.round(Math.sqrt((count * width) / height)));
    const rows = Math.max(1, Math.ceil(count / cols));
    const cellW = width / cols;
    const cellH = height / rows;

    nodesRef.current = SKILL_NODES.map((n, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const jitterX = (rand(i, 1) - 0.5) * cellW * 0.7;
      const jitterY = (rand(i, 2) - 0.5) * cellH * 0.7;
      const x = Math.min(
        width - NODE_RADIUS,
        Math.max(NODE_RADIUS, (col + 0.5) * cellW + jitterX),
      );
      const y = Math.min(
        height - NODE_RADIUS,
        Math.max(NODE_RADIUS, (row + 0.5) * cellH + jitterY),
      );

      const angle = rand(i, 3) * Math.PI * 2;
      const speed = MIN_SPEED + rand(i, 4) * (MAX_SPEED - MIN_SPEED);

      return {
        id: n.id,
        label: n.label,
        category: n.category,
        color: CATEGORY_COLORS[n.category],
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        speedFactor: 1,
      };
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    reduceMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const edgesResolved = SKILL_EDGES.filter(
      (e) =>
        SKILL_NODES.some((n) => n.id === e.from) &&
        SKILL_NODES.some((n) => n.id === e.to),
    );

    const isInFilter = (category: SkillCategory) => {
      const active = activeCategoriesRef.current;
      return active.size === 0 || active.has(category);
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      // Guard against a resize/layout feedback loop: only recompute when the
      // measured size actually changed. The canvas is absolutely positioned
      // so it can't feed back into this, but this keeps it defensive.
      if (
        Math.abs(rect.width - sizeRef.current.width) < 0.5 &&
        Math.abs(rect.height - sizeRef.current.height) < 0.5
      ) {
        return;
      }

      const prev = sizeRef.current;
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = { width: rect.width, height: rect.height };
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (nodesRef.current.length === 0) {
        // First layout.
        seedNodes(rect.width, rect.height);
      } else if (prev.width > 0 && prev.height > 0) {
        // Later resizes: rescale in place instead of reseeding, so nodes
        // don't jump — they keep wandering, just within the new bounds.
        const scaleX = rect.width / prev.width;
        const scaleY = rect.height / prev.height;
        for (const node of nodesRef.current) {
          node.x = Math.min(
            rect.width - NODE_RADIUS,
            Math.max(NODE_RADIUS, node.x * scaleX),
          );
          node.y = Math.min(
            rect.height - NODE_RADIUS,
            Math.max(NODE_RADIUS, node.y * scaleY),
          );
          node.vx *= scaleX;
          node.vy *= scaleY;
        }
      }
    };

    const findHover = (mx: number, my: number) => {
      let closest: NodeState | null = null;
      let closestDist = Infinity;
      for (const node of nodesRef.current) {
        if (!isInFilter(node.category)) continue; // filtered-out nodes aren't hoverable
        const dx = node.x - mx;
        const dy = node.y - my;
        const dist = Math.hypot(dx, dy);
        if (dist <= NODE_RADIUS + HOVER_PADDING && dist < closestDist) {
          closest = node;
          closestDist = dist;
        }
      }
      return closest;
    };

    const draw = () => {
      const { width, height } = sizeRef.current;
      ctx.clearRect(0, 0, width, height);

      const hoveredId = hoveredRef.current;
      const nodeById = new Map(nodesRef.current.map((n) => [n.id, n]));
      const neighbors = hoveredId ? neighborsById.get(hoveredId) : null;
      // While a node is hovered: it + its direct connections stay "in play"; everything else dims.
      const highlightSet = hoveredId
        ? new Set<string>([hoveredId, ...(neighbors ?? [])])
        : null;

      // Edges first, underneath nodes.
      for (const edge of edgesResolved) {
        const a = nodeById.get(edge.from);
        const b = nodeById.get(edge.to);
        if (!a || !b) continue;

        const filteredOut = !isInFilter(a.category) || !isInFilter(b.category);
        const touchesHovered =
          hoveredId && (edge.from === hoveredId || edge.to === hoveredId);
        const dimmedByHover = highlightSet !== null && !touchesHovered;

        let alpha = 0.1;
        let width_ = 0.8;
        if (filteredOut) {
          alpha = DIM_ALPHA_FILTER * 0.4;
        } else if (touchesHovered) {
          alpha = 0.5;
          width_ = 1.3;
        } else if (dimmedByHover) {
          alpha = DIM_ALPHA_HOVER * 0.5;
        }

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(219, 231, 223, ${alpha})`;
        ctx.lineWidth = width_;
        ctx.stroke();
      }

      // Nodes on top.
      for (const node of nodesRef.current) {
        const filteredOut = !isInFilter(node.category);
        const isHovered = node.id === hoveredId;
        const inHighlight = highlightSet === null || highlightSet.has(node.id);

        let alpha = 0.85;
        let radius = NODE_RADIUS;
        if (filteredOut) {
          alpha = DIM_ALPHA_FILTER;
        } else if (isHovered) {
          alpha = 1;
          radius = NODE_RADIUS + 2;
        } else if (!inHighlight) {
          alpha = DIM_ALPHA_HOVER;
        } else if (highlightSet !== null) {
          // A direct neighbor of the hovered node — full brightness, same size.
          alpha = 1;
        }

        if (isHovered && !filteredOut) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = `${node.color}33`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    drawRef.current = draw;

    let raf = 0;
    let lastT = performance.now();

    const tick = (t: number) => {
      const dt = t - lastT;
      lastT = t;
      const { width, height } = sizeRef.current;

      for (const node of nodesRef.current) {
        const target = node.id === hoveredRef.current ? HOVER_SPEED_FACTOR : 1;
        node.speedFactor += (target - node.speedFactor) * SPEED_EASE;
        const step = dt * node.speedFactor;

        node.x += node.vx * step;
        node.y += node.vy * step;

        // Gentle bounce off the container walls — this is what lets a node
        // wander the full width/height instead of staying in one corner.
        if (node.x < NODE_RADIUS) {
          node.x = NODE_RADIUS;
          node.vx = Math.abs(node.vx);
        } else if (node.x > width - NODE_RADIUS) {
          node.x = width - NODE_RADIUS;
          node.vx = -Math.abs(node.vx);
        }
        if (node.y < NODE_RADIUS) {
          node.y = NODE_RADIUS;
          node.vy = Math.abs(node.vy);
        } else if (node.y > height - NODE_RADIUS) {
          node.y = height - NODE_RADIUS;
          node.vy = -Math.abs(node.vy);
        }
      }

      draw();
      raf = requestAnimationFrame(tick);
    };

    const updateTooltip = () => {
      const hovered = hoveredRef.current
        ? nodesRef.current.find((n) => n.id === hoveredRef.current)
        : null;
      setTooltip(
        hovered
          ? {
              x: hovered.x,
              y: hovered.y,
              label: hovered.label,
              category: hovered.category,
            }
          : null,
      );
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = findHover(mx, my);
      const nextId = hit?.id ?? null;
      if (nextId !== hoveredRef.current) {
        hoveredRef.current = nextId;
        updateTooltip();
        if (reduceMotionRef.current) draw();
      } else if (reduceMotionRef.current) {
        updateTooltip();
      }
    };

    const onLeave = () => {
      hoveredRef.current = null;
      updateTooltip();
      if (reduceMotionRef.current) draw();
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduceMotionRef.current) draw();
    });
    ro.observe(container);

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    if (reduceMotionRef.current) {
      draw(); // single static frame — no rAF loop, hover still works via redraws above
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [neighborsById]);

  return (
    <div className="w-full">
      <p className="mb-3 font-mono text-xs text-mute">
        <span className="text-phos-dim">// </span>live map of what I actually
        work with
      </p>

      <div
        ref={containerRef}
        className="relative hidden h-[420px] w-full overflow-hidden rounded-lg border border-line bg-line/5 lg:block"
      >
        <canvas ref={canvasRef} className="skills-graph-canvas" />
        {tooltip && (
          <div
            className="skills-graph-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.label}
            <span
              className="skills-graph-tooltip__category"
              style={{ color: CATEGORY_COLORS[tooltip.category] }}
            >
              {CATEGORY_LABELS[tooltip.category]}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 hidden flex-wrap items-center gap-2 lg:flex">
        {ALL_CATEGORIES.map((cat) => {
          const isActive = activeCategories.has(cat);
          const color = CATEGORY_COLORS[cat];
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-all duration-200 cursor-pointer"
              style={{
                borderColor: isActive ? color : "var(--color-line)",
                color: isActive ? color : "var(--color-mute)",
                backgroundColor: isActive ? `${color}1a` : "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${color}15`;
                e.currentTarget.style.borderColor = `${color}80`;
                e.currentTarget.style.color = color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isActive
                  ? `${color}1a`
                  : "transparent";
                e.currentTarget.style.borderColor = isActive
                  ? color
                  : "var(--color-line)";
                e.currentTarget.style.color = isActive
                  ? color
                  : "var(--color-mute)";
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              {CATEGORY_LABELS[cat]}
            </button>
          );
        })}
        {activeCategories.size > 0 && (
          <button
            type="button"
            onClick={clearFilter}
            className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-mute transition-colors hover:border-phos-dim hover:text-phos"
          >
            show all
          </button>
        )}
      </div>
    </div>
  );
}
