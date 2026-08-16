'use client';

import React, { useEffect, useRef } from 'react';
import type { ParticleMotif } from '@/lib/schema';

interface ParticleCanvasProps {
  motif?: ParticleMotif;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  angularSpeed: number;
  opacity: number;
  targetOpacity: number;
  currentOpacity: number;
  swayAmplitude: number;
  swayFrequency: number;
  timeOffset: number;
  type: 'bubble' | 'petal' | 'sparkle' | 'leaf' | 'star' | 'flare' | 'wave' | 'snow';
  isFadingOut: boolean;
}

export function ParticleCanvas({ motif = 'mixed' }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motifRef = useRef<ParticleMotif>(motif);
  motifRef.current = motif;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let isMobile = false;

    // Throttled color reading
    let colorA = 'rgba(183, 154, 224, 0.4)';
    let colorB = 'rgba(243, 174, 194, 0.4)';
    let lastColorCheck = 0;

    function updateColors() {
      const now = performance.now();
      if (now - lastColorCheck < 200) return;
      lastColorCheck = now;

      const style = getComputedStyle(document.documentElement);
      const rawA = style.getPropertyValue('--g-blob-a').trim() || '#B79AE0';
      const rawB = style.getPropertyValue('--g-blob-b').trim() || '#F3AEC2';
      colorA = rawA;
      colorB = rawB;
    }

    const particles: Particle[] = [];
    const MAX_PARTICLES = 60;

    function getTargetCount(): number {
      return isMobile ? Math.floor(MAX_PARTICLES * 0.55) : MAX_PARTICLES;
    }

    function initParticle(p?: Partial<Particle>): Particle {
      const currentM = motifRef.current;
      let pType: Particle['type'] = 'bubble';
      if (currentM === 'bubble') pType = 'bubble';
      else if (currentM === 'petal') pType = 'petal';
      else if (currentM === 'sparkle') pType = 'sparkle';
      else if (currentM === 'leaf') pType = 'leaf';
      else if (currentM === 'star') pType = 'star';
      else if (currentM === 'flare') pType = 'flare';
      else if (currentM === 'wave') pType = 'wave';
      else if (currentM === 'snow') pType = 'snow';
      else {
        const rand = Math.random();
        pType = rand < 0.35 ? 'bubble' : rand < 0.65 ? 'petal' : rand < 0.85 ? 'sparkle' : 'star';
      }

      const size =
        pType === 'sparkle' || pType === 'star'
          ? 3 + Math.random() * 5
          : pType === 'wave'
          ? 14 + Math.random() * 16
          : pType === 'flare'
          ? 6 + Math.random() * 12
          : pType === 'snow'
          ? 4 + Math.random() * 6
          : 8 + Math.random() * 14;

      const speed =
        pType === 'petal' || pType === 'leaf' || pType === 'snow'
          ? 0.5 + Math.random() * 0.7
          : pType === 'wave'
          ? 0.3 + Math.random() * 0.5
          : 0.4 + Math.random() * 0.6;
      const targetOpacity = 0.2 + Math.random() * 0.35;

      return {
        x: p?.x ?? Math.random() * width,
        y:
          p?.y ??
          (pType === 'bubble' || pType === 'flare'
            ? height + 20
            : -20 - Math.random() * 100),
        size,
        speed,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.02,
        opacity: targetOpacity,
        targetOpacity,
        currentOpacity: 0,
        swayAmplitude: 12 + Math.random() * 28,
        swayFrequency: 0.001 + Math.random() * 0.0015,
        timeOffset: Math.random() * 10000,
        type: pType,
        isFadingOut: false,
        ...p,
      };
    }

    function resize() {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      isMobile = width < 768;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx?.scale(dpr, dpr);

      // Populate initial pool
      const target = getTargetCount();
      if (particles.length === 0) {
        for (let i = 0; i < target; i++) {
          const p = initParticle({ y: Math.random() * height });
          p.currentOpacity = p.targetOpacity;
          particles.push(p);
        }
      }
    }

    window.addEventListener('resize', resize);
    resize();

    function drawBubble(p: Particle, t: number) {
      if (!ctx) return;
      const sway = Math.sin((t + p.timeOffset) * p.swayFrequency) * 12;
      const curX = p.x + sway;
      const curY = p.y;

      ctx.save();
      ctx.globalAlpha = p.currentOpacity;
      ctx.fillStyle = colorA;
      ctx.beginPath();
      ctx.arc(curX, curY, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Top-left highlight arc
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = p.currentOpacity * 0.7;
      ctx.beginPath();
      ctx.arc(curX, curY, p.size * 0.7, Math.PI * 1.1, Math.PI * 1.6);
      ctx.stroke();

      ctx.restore();
    }

    function drawPetal(p: Particle, t: number) {
      if (!ctx) return;
      const sway = Math.sin((t + p.timeOffset) * p.swayFrequency) * p.swayAmplitude;
      const curX = p.x + sway;
      const curY = p.y;

      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.currentOpacity;
      ctx.fillStyle = colorB;

      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.8, -p.size * 0.3, p.size * 0.8, p.size * 0.6, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.8, p.size * 0.6, -p.size * 0.8, -p.size * 0.3, 0, -p.size);
      ctx.fill();

      ctx.restore();
    }

    function drawSparkle(p: Particle, t: number) {
      if (!ctx) return;
      const pulse = 0.6 + 0.4 * Math.sin((t + p.timeOffset) * 0.003);
      const curAlpha = p.currentOpacity * pulse;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = curAlpha;
      ctx.fillStyle = colorA;

      // 4-point star
      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.25, -s * 0.25);
      ctx.lineTo(s, 0);
      ctx.lineTo(s * 0.25, s * 0.25);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.25, s * 0.25);
      ctx.lineTo(-s, 0);
      ctx.lineTo(-s * 0.25, -s * 0.25);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    function drawLeaf(p: Particle, t: number) {
      if (!ctx) return;
      const sway = Math.sin((t + p.timeOffset) * p.swayFrequency) * 20;

      ctx.save();
      ctx.translate(p.x + sway, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.currentOpacity;
      ctx.fillStyle = '#5FAE84';

      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
      ctx.fill();

      // Vein
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.8);
      ctx.lineTo(0, p.size * 0.8);
      ctx.stroke();

      ctx.restore();
    }

    function drawStar(p: Particle, t: number) {
      if (!ctx) return;
      const pulse = 0.55 + 0.45 * Math.sin((t + p.timeOffset) * 0.0035);
      const curAlpha = p.currentOpacity * pulse;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle + t * 0.0005);
      ctx.globalAlpha = curAlpha;
      ctx.fillStyle = colorA;

      // 5-point star
      const spikes = 5;
      const outerRadius = p.size;
      const innerRadius = p.size * 0.45;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(0, -outerRadius);
      for (let i = 0; i < spikes; i++) {
        let x = Math.cos(rot) * outerRadius;
        let y = Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = Math.cos(rot) * innerRadius;
        y = Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(0, -outerRadius);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    function drawFlare(p: Particle, t: number) {
      if (!ctx) return;
      const pulse = 0.6 + 0.4 * Math.sin((t + p.timeOffset) * 0.002);
      const curAlpha = p.currentOpacity * pulse;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = curAlpha;

      // Radial warm flare glow
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.4, colorA);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function drawWave(p: Particle, t: number) {
      if (!ctx) return;
      const sway = Math.sin((t + p.timeOffset) * p.swayFrequency) * 15;
      ctx.save();
      ctx.translate(p.x + sway, p.y);
      ctx.globalAlpha = p.currentOpacity * 0.65;
      ctx.strokeStyle = colorA;
      ctx.lineWidth = 1.5;

      // Smooth wave curve
      ctx.beginPath();
      ctx.moveTo(-p.size, 0);
      ctx.quadraticCurveTo(-p.size * 0.5, -4, 0, 0);
      ctx.quadraticCurveTo(p.size * 0.5, 4, p.size, 0);
      ctx.stroke();

      ctx.restore();
    }

    function drawSnow(p: Particle, t: number) {
      if (!ctx) return;
      const sway = Math.sin((t + p.timeOffset) * p.swayFrequency) * 16;
      ctx.save();
      ctx.translate(p.x + sway, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.currentOpacity * 0.8;
      ctx.fillStyle = '#FFFFFF';

      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    let lastTime = performance.now();

    function render(currentTime: number) {
      const dt = Math.min(currentTime - lastTime, 50);
      lastTime = currentTime;

      updateColors();

      ctx?.clearRect(0, 0, width, height);

      const targetCount = getTargetCount();
      while (particles.length < targetCount) {
        particles.push(initParticle());
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]!;

        // Fade in / out
        if (p.isFadingOut) {
          p.currentOpacity = Math.max(0, p.currentOpacity - 0.015);
          if (p.currentOpacity <= 0) {
            // Re-initialize with new active motif
            particles[i] = initParticle();
            continue;
          }
        } else if (p.currentOpacity < p.targetOpacity) {
          p.currentOpacity = Math.min(p.targetOpacity, p.currentOpacity + 0.015);
        }

        // Movement
        if (p.type === 'bubble' || p.type === 'flare') {
          p.y -= p.speed * (dt / 16);
          if (p.y < -30) {
            p.y = height + 20;
            p.x = Math.random() * width;
          }
        } else if (p.type === 'sparkle' || p.type === 'star') {
          p.x += p.speed * 0.3 * (dt / 16);
          if (p.x > width + 20) {
            p.x = -20;
            p.y = Math.random() * height;
          }
        } else if (p.type === 'wave') {
          p.x += p.speed * 0.6 * (dt / 16);
          p.y += p.speed * 0.1 * (dt / 16);
          if (p.x > width + 40) {
            p.x = -40;
            p.y = Math.random() * height;
          }
        } else {
          // Petal / Leaf / Snow fall down
          p.y += p.speed * (dt / 16);
          p.angle += p.angularSpeed * (dt / 16);
          if (p.y > height + 30) {
            p.y = -20;
            p.x = Math.random() * width;
          }
        }

        if (p.type === 'bubble') drawBubble(p, currentTime);
        else if (p.type === 'petal') drawPetal(p, currentTime);
        else if (p.type === 'sparkle') drawSparkle(p, currentTime);
        else if (p.type === 'leaf') drawLeaf(p, currentTime);
        else if (p.type === 'star') drawStar(p, currentTime);
        else if (p.type === 'flare') drawFlare(p, currentTime);
        else if (p.type === 'wave') drawWave(p, currentTime);
        else if (p.type === 'snow') drawSnow(p, currentTime);
      }

      animId = requestAnimationFrame(render);
    }

    function handleVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);
    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
