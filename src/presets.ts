// Presets of classical sculpture reference pairs represented as SVG Data URLs for reliable, instant loading.
// These are beautiful vector drawings showing a side profile or front face reference and its corresponding sculpture.

export interface FacePreset {
  id: string;
  name: string;
  description: string;
  portrait: string; // Base64 or Data URI
  sculpture: string; // Base64 or Data URI
  // Preset landmark coordinates matching our scale of 0-1000
  portraitLandmarks: {
    foreheadTop: { x: number; y: number };
    chin: { x: number; y: number };
    leftEyeCenter: { x: number; y: number };
    rightEyeCenter: { x: number; y: number };
    noseLeft: { x: number; y: number };
    noseRight: { x: number; y: number };
    mouthLeft: { x: number; y: number };
    mouthRight: { x: number; y: number };
    headLeft: { x: number; y: number };
    headRight: { x: number; y: number };
  };
  sculptureLandmarks: {
    foreheadTop: { x: number; y: number };
    chin: { x: number; y: number };
    leftEyeCenter: { x: number; y: number };
    rightEyeCenter: { x: number; y: number };
    noseLeft: { x: number; y: number };
    noseRight: { x: number; y: number };
    mouthLeft: { x: number; y: number };
    mouthRight: { x: number; y: number };
    headLeft: { x: number; y: number };
    headRight: { x: number; y: number };
  };
}

// Inline SVGs to guarantee they load perfectly without internet requirements.
// Portrait uses clean outlines with some skin tone background.
// Sculpture uses classical clay-textured outlines.
const createAgrippaPortraitSvg = () => `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="100%" height="100%" fill="%23f4efe6"/>
  <!-- Head background -->
  <path d="M150 250 C150 120, 350 120, 350 250 C350 370, 320 440, 250 440 C180 440, 150 370, 150 250 Z" fill="%23e8dec9" stroke="%23bc9d7b" stroke-width="2"/>
  <!-- Hair line -->
  <path d="M160 210 Q250 140, 340 210 Q350 170, 320 150 Q250 140, 180 150 Q150 170, 160 210 Z" fill="%23a4835e"/>
  <!-- Eyes -->
  <circle cx="210" cy="230" r="14" fill="white" stroke="%237c5f3e" stroke-width="2"/>
  <circle cx="210" cy="230" r="6" fill="%234a3b2c"/>
  <circle cx="290" cy="230" r="14" fill="white" stroke="%237c5f3e" stroke-width="2"/>
  <circle cx="290" cy="230" r="6" fill="%234a3b2c"/>
  <!-- Eyebrows -->
  <path d="M185 210 Q210 200, 235 215" stroke="%234a3b2c" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M265 215 Q290 200, 315 210" stroke="%234a3b2c" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- Nose (Classic Roman nose) -->
  <path d="M250 215 L238 300 Q250 315, 262 300 Z" fill="%23decfa8" stroke="%23bc9d7b" stroke-width="2"/>
  <!-- Mouth (Detailed lips) -->
  <path d="M210 355 Q250 345, 290 355" stroke="%238a5343" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M220 355 Q250 368, 280 355" stroke="%23a66957" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Ears -->
  <path d="M150 230 C135 230, 135 280, 150 270" fill="%23decfa8" stroke="%23bc9d7b" stroke-width="2"/>
  <path d="M350 230 C365 230, 365 280, 350 270" fill="%23decfa8" stroke="%23bc9d7b" stroke-width="2"/>
  <!-- Neck and shoulders -->
  <path d="M190 410 L160 480 L340 480 L310 410 Z" fill="%23e8dec9" stroke="%23bc9d7b" stroke-width="2"/>
  <!-- Text Label -->
  <text x="250" y="45" font-family="sans-serif" font-size="18" font-weight="bold" fill="%237c5f3e" text-anchor="middle">ROMAN PORTRAIT SKETCH</text>
</svg>`;

const createAgrippaSculptureSvg = () => `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="100%" height="100%" fill="%23e4e9ec"/>
  <!-- Clay Bust background -->
  <path d="M140 250 C140 100, 360 100, 360 250 C360 360, 335 420, 250 420 C165 420, 140 360, 140 250 Z" fill="%23b8c3c9" stroke="%23788a94" stroke-width="3"/>
  <!-- Hair locks (sculpted clay chunks) -->
  <path d="M145 220 Q250 120, 355 220 Q365 170, 330 140 Q250 125, 170 140 Q135 170, 145 220 Z" fill="%239aa8b0" stroke="%23788a94" stroke-width="2"/>
  <!-- Eyes (clay blanks - typically un-carved pupil in ancient style or blank) -->
  <ellipse cx="205" cy="235" rx="16" ry="12" fill="%23ccd5db" stroke="%23788a94" stroke-width="2"/>
  <ellipse cx="295" cy="235" rx="16" ry="12" fill="%23ccd5db" stroke="%23788a94" stroke-width="2"/>
  <circle cx="205" cy="235" r="4" fill="%23788a94"/>
  <circle cx="295" cy="235" r="4" fill="%23788a94"/>
  <!-- Eyebrows (carved edge) -->
  <path d="M180 215 Q205 205, 230 220" stroke="%23677983" stroke-width="3" fill="none"/>
  <path d="M270 220 Q295 205, 320 215" stroke="%23677983" stroke-width="3" fill="none"/>
  <!-- Wide Nose (clay excess - area for improvement) -->
  <path d="M250 215 L232 310 Q250 325, 268 310 Z" fill="%239aa8b0" stroke="%23788a94" stroke-width="3"/>
  <!-- Mouth (clay chisel lines - slightly shorter/narrower lips) -->
  <path d="M215 365 Q250 358, 285 365" stroke="%23677983" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- Ears -->
  <path d="M140 230 C125 230, 125 285, 140 275" fill="%23ccd5db" stroke="%23788a94" stroke-width="2"/>
  <path d="M360 230 C375 230, 375 285, 360 275" fill="%23ccd5db" stroke="%23788a94" stroke-width="2"/>
  <!-- Pedestal base of classical bust -->
  <path d="M180 420 L150 460 L350 460 L320 420 Z" fill="%23ccd5db" stroke="%23788a94" stroke-width="3"/>
  <rect x="200" y="460" width="100" height="30" rx="5" fill="%239aa8b0" stroke="%23788a94" stroke-width="2"/>
  <!-- Label -->
  <text x="250" y="45" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23677983" text-anchor="middle">CLAY SCULPTURE BUST (WIP)</text>
</svg>`;


const createNefertitiPortraitSvg = () => `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="100%" height="100%" fill="%23fdfcf7"/>
  <!-- Egyptian Portrait style -->
  <path d="M180 230 C180 100, 320 100, 320 230 C320 370, 290 420, 250 420 C210 420, 180 370, 180 230 Z" fill="%23f0d2b2" stroke="%23c49a6c" stroke-width="2"/>
  <!-- Egyptian Crown -->
  <path d="M175 140 L160 50 L340 50 L325 140 Z" fill="%231a365d" stroke="%23c49a6c" stroke-width="3"/>
  <rect x="160" y="100" width="180" height="20" fill="%23d69e2e"/>
  <!-- Eye makeup (Kohl eyeliner) -->
  <path d="M200 220 Q220 210, 235 225 L245 220" stroke="black" stroke-width="4" fill="none"/>
  <circle cx="218" cy="223" r="7" fill="black"/>
  <circle cx="218" cy="223" r="2" fill="white"/>
  <path d="M265 220 L275 225 Q290 210, 310 220" stroke="black" stroke-width="4" fill="none"/>
  <circle cx="288" cy="223" r="7" fill="black"/>
  <circle cx="288" cy="223" r="2" fill="white"/>
  <!-- Nose (Slender) -->
  <path d="M250 220 L242 290 L258 290 Z" fill="%23e9bc8d" stroke="%23c49a6c" stroke-width="2"/>
  <!-- Elegant mouth -->
  <path d="M220 340 Q250 330, 280 340" stroke="%239b2c2c" stroke-width="4" fill="none"/>
  <path d="M225 340 Q250 355, 275 340" stroke="%239b2c2c" stroke-width="3" fill="none"/>
  <!-- Long slender neck -->
  <path d="M220 390 L200 480 L300 480 L280 390 Z" fill="%23f0d2b2" stroke="%23c49a6c" stroke-width="2"/>
  <path d="M205 430 Q250 450, 295 430" stroke="%23d69e2e" stroke-width="4" fill="none"/>
  <text x="250" y="30" font-family="sans-serif" font-size="18" font-weight="bold" fill="%231a365d" text-anchor="middle">Symmetrical Queen Portrait</text>
</svg>`;

const createNefertitiSculptureSvg = () => `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="100%" height="100%" fill="%23ece9e6"/>
  <!-- Egyptian Sculpture Work in Progress (wider neck, asymmetric mouth) -->
  <path d="M175 230 C175 100, 325 100, 325 230 C325 360, 295 425, 250 425 C205 425, 175 360, 175 230 Z" fill="%23dcd5cc" stroke="%239e9587" stroke-width="3"/>
  <!-- Crown sculpted rough -->
  <path d="M170 145 L155 55 L345 55 L330 145 Z" fill="%23c0b5a6" stroke="%239e9587" stroke-width="2"/>
  <!-- Eyes rough carve -->
  <ellipse cx="215" cy="225" rx="16" ry="10" fill="%23ece6de" stroke="%239e9587" stroke-width="2"/>
  <circle cx="215" cy="225" r="5" fill="%239e9587"/>
  <ellipse cx="285" cy="225" rx="16" ry="10" fill="%23ece6de" stroke="%239e9587" stroke-width="2"/>
  <!-- One eye lacks inlay - classical WIP detail! -->
  <!-- Nose (Slightly wider) -->
  <path d="M250 225 L240 295 L260 295 Z" fill="%23d2c7b9" stroke="%239e9587" stroke-width="3"/>
  <!-- Asymmetric mouth -->
  <path d="M222 345 Q252 338, 282 342" stroke="%23857867" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- Wide unfinished neck -->
  <path d="M210 395 L180 480 L320 480 L290 395 Z" fill="%23dcd5cc" stroke="%239e9587" stroke-width="3"/>
  <text x="250" y="30" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23857867" text-anchor="middle">Clay Queen Sculpture (WIP)</text>
</svg>`;


export const PRESETS: FacePreset[] = [
  {
    id: "agrippa",
    name: "Classic Roman Bust",
    description: "Roman general Agrippa. Portrait sketch vs. marble-style clay bust with broad features and jaw.",
    portrait: createAgrippaPortraitSvg(),
    sculpture: createAgrippaSculptureSvg(),
    portraitLandmarks: {
      foreheadTop: { x: 500, y: 150 },
      chin: { x: 500, y: 880 },
      leftEyeCenter: { x: 420, y: 460 },
      rightEyeCenter: { x: 580, y: 460 },
      noseLeft: { x: 476, y: 600 },
      noseRight: { x: 524, y: 600 },
      mouthLeft: { x: 420, y: 710 },
      mouthRight: { x: 580, y: 710 },
      headLeft: { x: 300, y: 500 },
      headRight: { x: 700, y: 500 }
    },
    sculptureLandmarks: {
      foreheadTop: { x: 500, y: 140 },
      chin: { x: 500, y: 840 },
      leftEyeCenter: { x: 410, y: 470 },
      rightEyeCenter: { x: 590, y: 470 },
      noseLeft: { x: 464, y: 620 },
      noseRight: { x: 536, y: 620 },
      mouthLeft: { x: 430, y: 730 },
      mouthRight: { x: 570, y: 730 },
      headLeft: { x: 280, y: 500 },
      headRight: { x: 720, y: 500 }
    }
  },
  {
    id: "nefertiti",
    name: "Symmetrical Queen Bust",
    description: "Slender Egyptian head with high crown. Portrait vs. clay sculpture with thick neck and tilted smile.",
    portrait: createNefertitiPortraitSvg(),
    sculpture: createNefertitiSculptureSvg(),
    portraitLandmarks: {
      foreheadTop: { x: 500, y: 140 },
      chin: { x: 500, y: 840 },
      leftEyeCenter: { x: 436, y: 446 },
      rightEyeCenter: { x: 576, y: 446 },
      noseLeft: { x: 484, y: 580 },
      noseRight: { x: 516, y: 580 },
      mouthLeft: { x: 440, y: 680 },
      mouthRight: { x: 560, y: 680 },
      headLeft: { x: 360, y: 460 },
      headRight: { x: 640, y: 460 }
    },
    sculptureLandmarks: {
      foreheadTop: { x: 500, y: 145 },
      chin: { x: 500, y: 850 },
      leftEyeCenter: { x: 430, y: 450 },
      rightEyeCenter: { x: 570, y: 450 },
      noseLeft: { x: 480, y: 590 },
      noseRight: { x: 520, y: 590 },
      mouthLeft: { x: 444, y: 690 },
      mouthRight: { x: 564, y: 684 },
      headLeft: { x: 350, y: 460 },
      headRight: { x: 650, y: 460 }
    }
  }
];
