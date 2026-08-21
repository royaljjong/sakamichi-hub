'use client';

import { useEffect, useRef } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AmbientBubble {
  x: number;
  y: number;
  r: number;
  baseX: number;
  speed: number;       // px/s upward
  freq: number;        // sway frequency
  timeOffset: number;
  colorKey: 0 | 1 | 2; // index into palette
  opacity: number;
  scaleBump: number;   // multiplier for D3 scale bump
  scaleBumpEnd: number; // timestamp when bump ends
}

interface TrailDroplet {
  x: number;
  y: number;
  r: number;
  born: number;        // performance.now()
  life: number;        // total ms = 1400
  sway: number;        // horizontal sway amplitude
  swayFreq: number;
  swayOffset: number;
  riseAmount: number;  // total px rise over life
  colorKey: 0 | 1 | 2;
}

interface Sparkle {
  x: number;
  y: number;
  size: number;
  born: number;
  life: number;        // 300 ms
  angle: number;
}

interface Palette {
  a: string;
  b: string;
  c: string;
  brand: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  return {
    a:     style.getPropertyValue('--g-blob-a').trim() || '#B79AE0',
    b:     style.getPropertyValue('--g-blob-b').trim() || '#F3AEC2',
    c:     style.getPropertyValue('--g-blob-c').trim() || '#8FCFEE',
    brand: style.getPropertyValue('--g-brand').trim()  || '#9E8FB8',
  };
}

function pickColorKey(): 0 | 1 | 2 {
  const r = Math.random();
  if (r < 0.40) return 0;
  if (r < 0.75) return 1;
  return 2;
}

function getColor(palette: Palette, key: 0 | 1 | 2): string {
  if (key === 0) return palette.a;
  if (key === 1) return palette.b;
  return palette.c;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Draw a highlight arc on top-left of a bubble */
function drawHighlight(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number,
  baseOpacity: number,
): void {
  const arcR = r * 0.68;
  ctx.beginPath();
  ctx.arc(cx, cy, arcR, Math.PI * 1.05, Math.PI * 1.55);
  ctx.strokeStyle = `rgba(255,255,255,${(baseOpacity * 0.75).toFixed(3)})`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** Draw a 4-pointed star at (cx, cy) with outer radius `size` */
function drawSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  angle: number,
  color: string,
  opacity: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.beginPath();
  const outer = size;
  const inner = size * 0.22;
  const pts = 4;
  for (let i = 0; i < pts * 2; i++) {
    const a = (i * Math.PI) / pts;
    const rad = i % 2 === 0 ? outer : inner;
    if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AquaPointerField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const spotlightEl = spotlightRef.current;
    if (!canvasEl || !spotlightEl) return;

    // Local non-null aliases used throughout closures
    const canvas: HTMLCanvasElement = canvasEl;
    const spotlight: HTMLDivElement = spotlightEl;

    // ── DPR & sizing ──
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.scale(dpr, dpr);
    }

    const ctx = canvas.getContext('2d')!;
    resize();

    // ── reduced-motion detection ──
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    // ── particle count caps ──
    const MAX_AMBIENT_FULL = 14;  // within 12–16 range
    const MAX_TOTAL_FULL   = 40;
    const MAX_AMBIENT = prefersReduced
      ? Math.round(MAX_AMBIENT_FULL * 0.40)
      : isMobile
        ? Math.round(MAX_AMBIENT_FULL * 0.55)
        : MAX_AMBIENT_FULL;
    const MAX_TOTAL = isMobile && !prefersReduced ? 22 : MAX_TOTAL_FULL;

    // ── palette cache (throttled 200 ms) ──
    let palette: Palette = readPalette();
    let paletteCacheTime = performance.now();

    function getCachedPalette(): Palette {
      const now = performance.now();
      if (now - paletteCacheTime > 200) {
        palette = readPalette();
        paletteCacheTime = now;
      }
      return palette;
    }

    // ── Layer A: ambient bubbles ──
    const ambientBubbles: AmbientBubble[] = [];

    function makeAmbientBubble(forcedY?: number): AmbientBubble {
      const r = lerp(12, 48, Math.random()) / 2; // radius (diameter 12–48)
      // opacity inversely proportional to size: small r≈6 → 0.55, large r≈24 → 0.25
      const opacityNorm = 1 - (r - 6) / (24 - 6); // 1 at small, 0 at large
      const opacity = lerp(0.25, 0.55, opacityNorm);
      return {
        x:          Math.random() * W,
        y:          forcedY !== undefined ? forcedY : H + Math.random() * 80 + 20,
        r,
        baseX:      Math.random() * W,
        speed:      lerp(8, 22, Math.random()),
        freq:       lerp(0.001, 0.002, Math.random()),
        timeOffset: Math.random() * 10000,
        colorKey:   pickColorKey(),
        opacity,
        scaleBump:    1,
        scaleBumpEnd: 0,
      };
    }

    // Seed bubbles across the entire canvas height initially
    for (let i = 0; i < MAX_AMBIENT; i++) {
      const b = makeAmbientBubble(Math.random() * H);
      b.baseX = b.x;
      ambientBubbles.push(b);
    }

    // ── Layer B: cursor trail droplets ──
    const trailDroplets: TrailDroplet[] = [];
    let lastSpawnTime  = 0;
    let lastPointerX   = 0;
    let lastPointerY   = 0;
    let cursorX        = W * 0.5;
    let cursorY        = H * 0.5;
    let lastMoveTime   = 0;

    // ── Layer C: spotlight glow (CSS spring) ──
    let spotTargetX = W * 0.5;
    let spotTargetY = H * 0.5;
    let spotActualX = W * 0.5;
    let spotActualY = H * 0.5;

    function updateSpotlight() {
      spotActualX += (spotTargetX - spotActualX) * 0.12;
      spotActualY += (spotTargetY - spotActualY) * 0.12;
      spotlight.style.setProperty('--aqua-x', spotActualX.toFixed(1) + 'px');
      spotlight.style.setProperty('--aqua-y', spotActualY.toFixed(1) + 'px');
    }

    // ── Layer D2: sparkle winks ──
    const sparkles: Sparkle[] = [];
    let nextSparkleTime = performance.now() + lerp(3000, 5000, Math.random());

    function spawnSparkle(x: number, y: number) {
      sparkles.push({
        x,
        y,
        size:  lerp(4, 8, Math.random()),
        born:  performance.now(),
        life:  300,
        angle: Math.random() * Math.PI * 2,
      });
    }

    // ── Layer D3: group transition wave ──
    let waveX         = -1;
    let waveStartTime = 0;
    let waveDuration  = 300;
    let waveActive    = false;
    let waveGroup     = '';

    const observer = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        if (mut.type === 'attributes' && mut.attributeName === 'data-group') {
          const el = mut.target as HTMLElement;
          const newGroup = el.getAttribute('data-group') ?? '';
          if (newGroup !== waveGroup) {
            waveGroup = newGroup;
            waveX = 0;
            waveStartTime = performance.now();
            waveActive = true;
            // force palette re-read immediately
            palette = readPalette();
            paletteCacheTime = performance.now();
            // spawn 2–3 extra sparkles near cursor
            const count = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
              spawnSparkle(
                cursorX + lerp(-30, 30, Math.random()),
                cursorY + lerp(-30, 30, Math.random()),
              );
            }
          }
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-group'] });

    // ── Pointer events ──
    function onPointerMove(e: PointerEvent) {
      cursorX = e.clientX;
      cursorY = e.clientY;
      lastMoveTime = performance.now();

      if (!prefersReduced) {
        // Layer C spring target
        spotTargetX = e.clientX;
        spotTargetY = e.clientY;

        // Layer B: trail droplet spawn
        const now = performance.now();
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        const delta = Math.sqrt(dx * dx + dy * dy);
        if (now - lastSpawnTime > 40 && delta > 4) {
          lastSpawnTime  = now;
          lastPointerX   = e.clientX;
          lastPointerY   = e.clientY;

          const totalParticles = ambientBubbles.length + trailDroplets.length + sparkles.length;
          if (totalParticles < MAX_TOTAL) {
            const r = lerp(6, 14, Math.random()) / 2;
            trailDroplets.push({
              x:          e.clientX,
              y:          e.clientY,
              r,
              born:       now,
              life:       1400,
              sway:       lerp(8, 18, Math.random()),
              swayFreq:   lerp(0.003, 0.006, Math.random()),
              swayOffset: Math.random() * 1000,
              riseAmount: lerp(12, 24, Math.random()),
              colorKey:   pickColorKey(),
            });
          }
        }
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // ── rAF loop ──
    let rafId   = 0;
    let lastTs  = performance.now();
    let paused  = false;

    function tick(ts: number) {
      if (paused) return;
      rafId = requestAnimationFrame(tick);

      const dt = Math.min(ts - lastTs, 50); // cap dt at 50 ms for tab-switch spikes
      lastTs = ts;

      const pal = getCachedPalette();

      ctx.clearRect(0, 0, W, H);

      // ── Layer C: spring update ──
      if (!prefersReduced) {
        updateSpotlight();
      }

      // ── Layer D3: wave advance ──
      if (waveActive) {
        const elapsed = ts - waveStartTime;
        const waveT   = Math.min(elapsed / waveDuration, 1);
        waveX = waveT * W;

        // Reassign color + bump scale for bubbles near wave x
        for (const b of ambientBubbles) {
          if (Math.abs(b.x - waveX) < 60) {
            b.colorKey   = pickColorKey();
            b.scaleBump  = 1.2;
            b.scaleBumpEnd = ts + 60;
          }
        }

        if (waveT >= 1) waveActive = false;
      }

      // ── Layer A: ambient bubbles ──
      for (const b of ambientBubbles) {
        // Update position
        const rise = (b.speed * dt) / 1000;
        b.y -= prefersReduced ? rise * 0.4 : rise;

        const sway = Math.sin((ts + b.timeOffset) * b.freq) * 18;
        b.x = b.baseX + sway;

        // Respawn when risen off top
        if (b.y < -30) {
          b.y    = H + 20 + Math.random() * 40;
          b.baseX = Math.random() * W;
          b.x     = b.baseX;
        }

        // Layer D1: cursor repel (skip in reduced-motion)
        if (!prefersReduced) {
          const rdx = b.x - cursorX;
          const rdy = b.y - cursorY;
          const d   = Math.sqrt(rdx * rdx + rdy * rdy);
          if (d > 0 && d < 180) {
            const force = (1 - d / 180) * 0.35;
            b.x += (rdx / d) * force * (dt / 16);
            b.y += (rdy / d) * force * (dt / 16);
          }
        }

        // Compute display radius with D3 scale bump
        let displayR = b.r;
        if (ts < b.scaleBumpEnd) {
          const bumpT = 1 - (b.scaleBumpEnd - ts) / 60;
          const bump  = lerp(b.scaleBump, 1, easeOutCubic(bumpT));
          displayR    = b.r * bump;
        } else {
          b.scaleBump = 1;
        }

        const color = getColor(pal, b.colorKey);

        // Draw bubble fill
        ctx.beginPath();
        ctx.arc(b.x, b.y, displayR, 0, Math.PI * 2);
        ctx.globalAlpha = b.opacity;
        ctx.fillStyle   = color;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Fake soft outer ring for large bubbles (r > 30 = radius > 15)
        if (b.r > 15) {
          ctx.beginPath();
          ctx.arc(b.x, b.y, displayR + 4, 0, Math.PI * 2);
          ctx.globalAlpha = b.opacity * 0.30;
          ctx.fillStyle   = color;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Highlight arc
        drawHighlight(ctx, b.x, b.y, displayR, b.opacity);
      }

      // ── Layer B: cursor trail droplets (skip in reduced-motion) ──
      if (!prefersReduced) {
        const now = ts;
        let i = trailDroplets.length - 1;
        while (i >= 0) {
          const drop = trailDroplets[i]!;
          const age  = now - drop.born;

          if (age >= drop.life) {
            trailDroplets.splice(i, 1);
            i--;
            continue;
          }

          const lifeT = age / drop.life; // 0→1

          // Scale: 0–200 ms ease in
          let scale: number;
          if (age < 200) {
            const scaleT = age / 200;
            scale = 1 - Math.pow(1 - scaleT, 3) * 0.7;
          } else {
            scale = 1;
          }

          // Y rise: 200–700 ms
          let riseY = 0;
          if (age > 200 && age < 700) {
            riseY = ((age - 200) / 500) * drop.riseAmount;
          } else if (age >= 700) {
            riseY = drop.riseAmount;
          }

          // X sway: 200–700 ms
          let swayX = 0;
          if (age > 200) {
            swayX = Math.sin((age + drop.swayOffset) * drop.swayFreq) * drop.sway;
          }

          // Opacity: 700–1400 ms fade
          let alpha: number;
          if (age < 700) {
            alpha = drop.r > 0 ? 0.7 : 0;
          } else {
            alpha = (1 - (age - 700) / 700) * 0.7;
          }

          const dx = drop.x + swayX;
          const dy = drop.y - riseY;
          const dr = drop.r * scale;

          const color = getColor(pal, drop.colorKey);

          ctx.beginPath();
          ctx.arc(dx, dy, dr, 0, Math.PI * 2);
          ctx.globalAlpha = alpha;
          ctx.fillStyle   = color;
          ctx.fill();
          ctx.globalAlpha = 1;

          drawHighlight(ctx, dx, dy, dr, alpha);

          i--;
          void lifeT; // suppress unused warning
        }
      }

      // ── Layer D2: sparkle winks (skip in reduced-motion) ──
      if (!prefersReduced) {
        // Trigger check
        const recentlyMoved = ts - lastMoveTime < 800;
        if (ts >= nextSparkleTime && recentlyMoved) {
          spawnSparkle(cursorX, cursorY);
          nextSparkleTime = ts + lerp(3000, 5000, Math.random());
        }

        let si = sparkles.length - 1;
        while (si >= 0) {
          const sp  = sparkles[si]!;
          const age = ts - sp.born;

          if (age >= sp.life) {
            sparkles.splice(si, 1);
            si--;
            continue;
          }

          sp.angle += 0.002 * dt;

          const pulse   = Math.sin(ts * 0.01) * 0.5 + 0.5;
          let opacity   = pulse;
          if (age > 200) {
            opacity = pulse * (1 - (age - 200) / 100);
          }
          opacity = Math.max(0, Math.min(1, opacity));

          drawSparkle(ctx, sp.x, sp.y, sp.size, sp.angle, pal.brand, opacity);

          si--;
        }

        // Enforce total particle cap: trim trail if needed
        while (
          ambientBubbles.length + trailDroplets.length + sparkles.length > MAX_TOTAL &&
          trailDroplets.length > 0
        ) {
          trailDroplets.shift();
        }
      }
    }

    rafId = requestAnimationFrame(tick);

    // ── Visibility ──
    function onVisibility() {
      if (document.hidden) {
        paused = true;
        cancelAnimationFrame(rafId);
      } else {
        paused  = false;
        lastTs  = performance.now();
        rafId   = requestAnimationFrame(tick);
      }
    }
    document.addEventListener('visibilitychange', onVisibility);

    // ── Resize ──
    function onResize() {
      const oldW = W;
      const oldH = H;
      resize();
      // Rescale bubble base positions proportionally
      for (const b of ambientBubbles) {
        b.baseX = (b.baseX / oldW) * W;
        b.x     = (b.x     / oldW) * W;
        b.y     = (b.y     / oldH) * H;
      }
    }
    window.addEventListener('resize', onResize);

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      observer.disconnect();
    };
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
      <canvas
        ref={canvasRef}
        style={{
          position:      'absolute',
          inset:         0,
          pointerEvents: 'none',
          zIndex:        0,
        }}
      />
      <div
        ref={spotlightRef}
        className="aqua-spotlight"
        style={{
          position:      'absolute',
          inset:         0,
          pointerEvents: 'none',
          zIndex:        0,
        }}
      />
    </div>
  );
}

export default AquaPointerField;
