/**
 * Signature Slope Paths for Background Morph Animation
 * Note: All paths share identical command sequence (M, C, C, L, L, Z) for smooth morphing.
 */

export const SLOPES: Record<string, string> = {
  home: 'M0,168 C240,120 480,196 720,152 C960,108 1200,178 1440,140 L1440,240 L0,240 Z',
  nogizaka46: 'M0,150 C300,196 560,104 820,140 C1080,176 1260,120 1440,158 L1440,240 L0,240 Z',
  sakurazaka46: 'M0,178 C220,130 460,182 700,128 C940,74 1220,168 1440,124 L1440,240 L0,240 Z',
  hinatazaka46: 'M0,132 C280,168 540,110 800,164 C1060,218 1240,132 1440,166 L1440,240 L0,240 Z',
  keyakizaka46: 'M0,160 C260,110 520,190 780,142 C1040,94 1250,180 1440,136 L1440,240 L0,240 Z',
};
