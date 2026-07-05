import React, { useState, useRef, useEffect } from "react";
import { 
  Camera, 
  Upload, 
  Grid, 
  Layers, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Info, 
  Move,
  ChevronRight,
  ZoomIn,
  Trash2,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import { PRESETS, FacePreset } from "./presets";
import { AnalysisResult, Landmarks, Point } from "./types";

interface LandmarkSequenceItem {
  key: keyof Landmarks;
  label: string;
  description: string;
}

interface ProjectSaveData {
  version: number;
  portraitImg: string;
  sculptureImg: string;
  portraitAspectRatio: number;
  sculptureAspectRatio: number;
  analysis: AnalysisResult;
  activePresetId: string;
  isCustom: boolean;
  showGrid: boolean;
  gridDensity: number;
  gridColor: string;
  gridOpacity: number;
  showLandmarks: boolean;
  language: 'en' | 'th';
}

const SAVE_KEY = 'sculpt_project';

const LANDMARK_SEQUENCE: LandmarkSequenceItem[] = [
  { key: "foreheadTop", label: "Forehead Top (Hairline)", description: "The exact center point of the hairline along the midline." },
  { key: "chin", label: "Chin Bottom", description: "The lowest center point of the chin contour." },
  { key: "leftEyeCenter", label: "Left Eye Center", description: "The exact center of the subject's left eye (observer's right)." },
  { key: "rightEyeCenter", label: "Right Eye Center", description: "The exact center of the subject's right eye (observer's left)." },
  { key: "noseLeft", label: "Left Nostril Flare", description: "The outermost lateral point of the left nostril." },
  { key: "noseRight", label: "Right Nostril Flare", description: "The outermost lateral point of the right nostril." },
  { key: "mouthLeft", label: "Mouth Left Corner", description: "The corner of the lips on the subject's left." },
  { key: "mouthRight", label: "Mouth Right Corner", description: "The corner of the lips on the subject's right." },
  { key: "headLeft", label: "Head Left Silhouette", description: "The outermost left boundary of the head contour (excluding ears)." },
  { key: "headRight", label: "Head Right Silhouette", description: "The outermost right boundary of the head contour (excluding ears)." }
];

const convertSvgToPng = (svgUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!svgUrl.startsWith("data:image/svg+xml")) {
      resolve(svgUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 500;
        canvas.height = img.naturalHeight || 500;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve(svgUrl);
        }
      } catch (e) {
        console.error("Canvas conversion failed:", e);
        resolve(svgUrl);
      }
    };
    img.onerror = (err) => {
      console.error("SVG image load failed:", err);
      resolve(svgUrl);
    };
    img.src = svgUrl;
  });
};

export default function App() {
  // Preset Selection
  const [activePresetId, setActivePresetId] = useState<string>("agrippa");
  
  // Image states
  const [portraitImg, setPortraitImg] = useState<string>(PRESETS[0].portrait);
  const [sculptureImg, setSculptureImg] = useState<string>(PRESETS[0].sculpture);
  
  // Aspect ratio states for auto-maximizing
  const [portraitAspectRatio, setPortraitAspectRatio] = useState<number>(1);
  const [sculptureAspectRatio, setSculptureAspectRatio] = useState<number>(1);

  useEffect(() => {
    if (!portraitImg) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setPortraitAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = portraitImg;
  }, [portraitImg]);

  useEffect(() => {
    if (!sculptureImg) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setSculptureAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = sculptureImg;
  }, [sculptureImg]);

  // Custom uploaded images flag
  const [isCustom, setIsCustom] = useState<boolean>(false);

  // Visualization options
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [gridDensity, setGridDensity] = useState<number>(12);
  const [gridColor, setGridColor] = useState<string>("#3B82F6");
  const [gridOpacity, setGridOpacity] = useState<number>(30);
  
  // Compare view modes (always side-by-side as requested)
  const viewMode = 'side-by-side';
  
  const [showLandmarks, setShowLandmarks] = useState<boolean>(true);
  const [heldCategoryKey, setHeldCategoryKey] = useState<string | null>(null);
  const [draggedPoint, setDraggedPoint] = useState<{ type: 'portrait' | 'sculpture'; key: keyof Landmarks } | null>(null);

  const [language, setLanguage] = useState<'en' | 'th'>(() => {
    const saved = localStorage.getItem('sculpt_language');
    return (saved === 'th' || saved === 'en') ? saved : 'en';
  });

  const changeLanguage = (lang: 'en' | 'th') => {
    setLanguage(lang);
    localStorage.setItem('sculpt_language', lang);
  };

  const t = (en: string, th: string) => (language === 'en' ? en : th);

  const getLandmarkLabel = (key: string) => {
    switch (key) {
      case "foreheadTop": return t("Forehead Top (Hairline)", "ส่วนบนของหน้าผาก (แนวไรผม)");
      case "chin": return t("Chin Bottom", "ส่วนล่างของคาง");
      case "leftEyeCenter": return t("Left Eye Center", "กึ่งกลางตาซ้าย");
      case "rightEyeCenter": return t("Right Eye Center", "กึ่งกลางตาขวา");
      case "noseLeft": return t("Left Nostril Flare", "ปีกจมูกซ้าย");
      case "noseRight": return t("Right Nostril Flare", "ปีกจมูกขวา");
      case "mouthLeft": return t("Mouth Left Corner", "มุมปากซ้าย");
      case "mouthRight": return t("Mouth Right Corner", "มุมปากขวา");
      case "headLeft": return t("Head Left Silhouette", "โครงศีรษะฝั่งซ้าย");
      case "headRight": return t("Head Right Silhouette", "โครงศีรษะฝั่งขวา");
      default: return "";
    }
  };

  const getLandmarkDescription = (key: string) => {
    switch (key) {
      case "foreheadTop": return t("The exact center point of the hairline along the midline.", "จุดกึ่งกลางที่แน่นอนของแนวไรผมตามแนวเส้นแบ่งครึ่ง");
      case "chin": return t("The lowest center point of the chin contour.", "จุดกึ่งกลางที่ต่ำที่สุดของโครงร่างคาง");
      case "leftEyeCenter": return t("The exact center of the subject's left eye (observer's right).", "จุดกึ่งกลางดวงตาข้างซ้ายของแบบ (ขวาของผู้สังเกต)");
      case "rightEyeCenter": return t("The exact center of the subject's right eye (observer's left).", "จุดกึ่งกลางดวงตาข้างขวาของแบบ (ซ้ายของผู้สังเกต)");
      case "noseLeft": return t("The outermost lateral point of the left nostril.", "จุดด้านข้างที่อยู่นอกสุดของปีกจมูกซ้าย");
      case "noseRight": return t("The outermost lateral point of the right nostril.", "จุดด้านข้างที่อยู่นอกสุดของปีกจมูกขวา");
      case "mouthLeft": return t("The corner of the lips on the subject's left.", "มุมริมฝีปากด้านซ้ายของแบบ");
      case "mouthRight": return t("The corner of the lips on the subject's right.", "มุมริมฝีปากด้านขวาของแบบ");
      case "headLeft": return t("The outermost left boundary of the head contour (excluding ears).", "ขอบเขตด้านซ้ายนอกสุดของโครงร่างศีรษะ (ไม่รวมใบหู)");
      case "headRight": return t("The outermost right boundary of the head contour (excluding ears).", "ขอบเขตด้านขวานอกสุดของโครงร่างศีรษะ (ไม่รวมใบหู)");
      default: return "";
    }
  };

  // Manual placement state
  const [placementState, setPlacementState] = useState<{
    active: boolean;
    target: 'portrait' | 'sculpture' | null;
    stepIndex: number;
  }>({
    active: false,
    target: null,
    stepIndex: 0
  });

  // Analysis result
  const [analysis, setAnalysis] = useState<AnalysisResult>({
    score: 82,
    portraitLandmarks: PRESETS[0].portraitLandmarks,
    sculptureLandmarks: PRESETS[0].sculptureLandmarks,
    categories: {
      headShape: {
        score: 82,
        feedback: "The sculpture head shape is slightly wider (Ratio 0.79) compared to the portrait (Ratio 0.72). The jawline has excess clay on both sides, making the overall silhouette wider.",
        portraitRatio: 0.72,
        sculptureRatio: 0.79,
        unit: "Width-to-Height Ratio"
      },
      headToEyeDistance: {
        score: 80,
        feedback: "The top of head to eye distance is slightly too long, meaning the eyes are set lower on the face than portrait.",
        portraitRatio: 42.5,
        sculptureRatio: 47.1,
        unit: "% of head height"
      },
      headToNoseDistance: {
        score: 72,
        feedback: "The top of head to nose distance is too long. The nose is positioned slightly too low vertically.",
        portraitRatio: 61.6,
        sculptureRatio: 68.6,
        unit: "% of head height"
      },
      eyeToNoseDistance: {
        score: 90,
        feedback: "The eye-to-nose vertical distance is extremely close to the portrait's proportions.",
        portraitRatio: 19.2,
        sculptureRatio: 21.4,
        unit: "% of head height"
      },
      eyeCenterWidth: {
        score: 88,
        feedback: "The eye center width (pupillary distance) matches very well. It is 48% of head width on your sculpture vs 48% on the portrait. Placement is solid.",
        portraitRatio: 0.48,
        sculptureRatio: 0.48,
        unit: "IPD vs Head Width"
      },
      noseWidth: {
        score: 70,
        feedback: "The nose on the sculpture is too wide (Ratio 0.28 vs 0.24 on portrait). The nostrils flare out too much. You need to narrow the alar base.",
        portraitRatio: 0.24,
        sculptureRatio: 0.28,
        unit: "Nose vs Head Width"
      },
      mouthWidth: {
        score: 85,
        feedback: "The mouth width is slightly narrow on your sculpture (Ratio 0.33 vs 0.36 on portrait). Consider extending the lip corners outwards by about 1.5mm each.",
        portraitRatio: 0.36,
        sculptureRatio: 0.33,
        unit: "Mouth vs Head Width"
      },
      eyeToSideDistance: {
        score: 90,
        feedback: "The distance from the eyes to the side of the head is perfectly aligned.",
        portraitRatio: 0.26,
        sculptureRatio: 0.26,
        unit: "Ratio to Head Width"
      },
      noseToSideDistance: {
        score: 90,
        feedback: "The distance from the nose to the side of the head is perfectly aligned.",
        portraitRatio: 0.38,
        sculptureRatio: 0.38,
        unit: "Ratio to Head Width"
      },
      mouthToSideDistance: {
        score: 90,
        feedback: "The distance from the mouth to the side of the head is perfectly aligned.",
        portraitRatio: 0.32,
        sculptureRatio: 0.32,
        unit: "Ratio to Head Width"
      }
    }
  });

  // Active Category Details Modal/Tooltip
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("headShape");

  // Track coordinates for cursor overlay
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [showRestoreBanner, setShowRestoreBanner] = useState<boolean>(false);
  const saveTimeoutRef = useRef<number>(0);

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'portrait' | 'sculpture') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setIsCustom(true);
      setActivePresetId("");
      
      const defaultPortraitLandmarks = {
        foreheadTop: { x: 500, y: 150 },
        chin: { x: 500, y: 880 },
        leftEyeCenter: { x: 380, y: 380 },
        rightEyeCenter: { x: 620, y: 380 },
        noseLeft: { x: 440, y: 560 },
        noseRight: { x: 560, y: 560 },
        mouthLeft: { x: 410, y: 710 },
        mouthRight: { x: 590, y: 710 },
        headLeft: { x: 250, y: 500 },
        headRight: { x: 750, y: 500 }
      };
      const defaultSculptureLandmarks = {
        foreheadTop: { x: 500, y: 160 },
        chin: { x: 495, y: 850 },
        leftEyeCenter: { x: 370, y: 390 },
        rightEyeCenter: { x: 610, y: 390 },
        noseLeft: { x: 430, y: 580 },
        noseRight: { x: 570, y: 580 },
        mouthLeft: { x: 400, y: 730 },
        mouthRight: { x: 580, y: 730 },
        headLeft: { x: 230, y: 500 },
        headRight: { x: 770, y: 500 }
      };

      if (target === 'portrait') {
        setPortraitImg(dataUrl);
        setAnalysis(prev => ({
          ...prev,
          portraitLandmarks: defaultPortraitLandmarks
        }));
        handleRecalculateRatios(defaultPortraitLandmarks, analysis.sculptureLandmarks);
      } else {
        setSculptureImg(dataUrl);
        setAnalysis(prev => ({
          ...prev,
          sculptureLandmarks: defaultSculptureLandmarks
        }));
        handleRecalculateRatios(analysis.portraitLandmarks, defaultSculptureLandmarks);
      }
    };
    reader.readAsDataURL(file);
  };

  // Preset Selection Handler
  const selectPreset = (preset: FacePreset) => {
    setActivePresetId(preset.id);
    setPortraitImg(preset.portrait);
    setSculptureImg(preset.sculpture);
    setIsCustom(false);
    
    // Load pre-analyzed landmarks & ratios
    const initialAnalysis = {
      score: preset.id === 'agrippa' ? 82 : 79,
      portraitLandmarks: preset.portraitLandmarks,
      sculptureLandmarks: preset.sculptureLandmarks,
      categories: preset.id === 'agrippa' ? {
        headShape: {
          score: 82,
          feedback: "The sculpture head shape is slightly wider (Ratio 0.79) compared to the portrait (Ratio 0.72). The jawline has excess clay on both sides, making the overall silhouette wider.",
          portraitRatio: 0.72,
          sculptureRatio: 0.79,
          unit: "Width-to-Height Ratio"
        },
        headToEyeDistance: {
          score: 80,
          feedback: "The top of head to eye distance is slightly too long, meaning the eyes are set lower on the face than portrait.",
          portraitRatio: 42.5,
          sculptureRatio: 47.1,
          unit: "% of head height"
        },
        headToNoseDistance: {
          score: 72,
          feedback: "The top of head to nose distance is too long. The nose is positioned slightly too low vertically.",
          portraitRatio: 61.6,
          sculptureRatio: 68.6,
          unit: "% of head height"
        },
        eyeToNoseDistance: {
          score: 90,
          feedback: "The eye-to-nose vertical distance is extremely close to the portrait's proportions.",
          portraitRatio: 19.2,
          sculptureRatio: 21.4,
          unit: "% of head height"
        },
        eyeCenterWidth: {
          score: 88,
          feedback: "The eye center width (pupillary distance) matches very well. It is 48% of head width on your sculpture vs 48% on the portrait. Placement is solid.",
          portraitRatio: 0.48,
          sculptureRatio: 0.48,
          unit: "IPD vs Head Width"
        },
        noseWidth: {
          score: 70,
          feedback: "The nose on the sculpture is too wide (Ratio 0.28 vs 0.24 on portrait). The nostrils flare out too much. You need to narrow the alar base.",
          portraitRatio: 0.24,
          sculptureRatio: 0.28,
          unit: "Nose vs Head Width"
        },
        mouthWidth: {
          score: 85,
          feedback: "The mouth width is slightly narrow on your sculpture (Ratio 0.33 vs 0.36 on portrait). Consider extending the lip corners outwards by about 1.5mm each.",
          portraitRatio: 0.36,
          sculptureRatio: 0.33,
          unit: "Mouth vs Head Width"
        },
        eyeToSideDistance: {
          score: 90,
          feedback: "",
          portraitRatio: 0,
          sculptureRatio: 0,
          unit: "Ratio to Head Width"
        },
        noseToSideDistance: {
          score: 90,
          feedback: "",
          portraitRatio: 0,
          sculptureRatio: 0,
          unit: "Ratio to Head Width"
        },
        mouthToSideDistance: {
          score: 90,
          feedback: "",
          portraitRatio: 0,
          sculptureRatio: 0,
          unit: "Ratio to Head Width"
        }
      } : {
        headShape: {
          score: 85,
          feedback: "Good skull framework match. The sculpture's width-to-height ratio is 0.73, while the portrait reference is 0.71.",
          portraitRatio: 0.71,
          sculptureRatio: 0.73,
          unit: "Width-to-Height Ratio"
        },
        headToEyeDistance: {
          score: 80,
          feedback: "The top of head to eye distance is slightly too long, meaning the eyes are set lower on the face than portrait.",
          portraitRatio: 42.5,
          sculptureRatio: 47.1,
          unit: "% of head height"
        },
        headToNoseDistance: {
          score: 72,
          feedback: "The top of head to nose distance is too long. The nose is positioned slightly too low vertically.",
          portraitRatio: 61.6,
          sculptureRatio: 68.6,
          unit: "% of head height"
        },
        eyeToNoseDistance: {
          score: 90,
          feedback: "The eye-to-nose vertical distance is extremely close to the portrait's proportions.",
          portraitRatio: 19.2,
          sculptureRatio: 21.4,
          unit: "% of head height"
        },
        eyeCenterWidth: {
          score: 92,
          feedback: "Superb alignment. Pupil spacing relative to temporal bones is highly accurate with only 2% deviation.",
          portraitRatio: 0.50,
          sculptureRatio: 0.49,
          unit: "IPD vs Head Width"
        },
        noseWidth: {
          score: 74,
          feedback: "The nose bridge and nostrils are somewhat wider than the portrait reference. Consider tapering the sides.",
          portraitRatio: 0.11,
          sculptureRatio: 0.14,
          unit: "Nose vs Head Width"
        },
        mouthWidth: {
          score: 81,
          feedback: "Mouth width is reasonably close (42% vs 40% of head width). However, the left corner is slightly elevated in comparison.",
          portraitRatio: 0.40,
          sculptureRatio: 0.42,
          unit: "Mouth vs Head Width"
        },
        eyeToSideDistance: {
          score: 90,
          feedback: "",
          portraitRatio: 0,
          sculptureRatio: 0,
          unit: "Ratio to Head Width"
        },
        noseToSideDistance: {
          score: 90,
          feedback: "",
          portraitRatio: 0,
          sculptureRatio: 0,
          unit: "Ratio to Head Width"
        },
        mouthToSideDistance: {
          score: 90,
          feedback: "",
          portraitRatio: 0,
          sculptureRatio: 0,
          unit: "Ratio to Head Width"
        }
      }
    };
    setAnalysis(initialAnalysis);
    handleRecalculateRatios(preset.portraitLandmarks, preset.sculptureLandmarks);
  };



  const handleRecalculateRatios = (customPl?: Landmarks, customSl?: Landmarks) => {
    const pl = customPl || analysis.portraitLandmarks;
    const sl = customSl || analysis.sculptureLandmarks;

    // Helper distance
    const distY = (p1: Point, p2: Point) => Math.abs(p1.y - p2.y);
    const distX = (p1: Point, p2: Point) => Math.abs(p1.x - p2.x);

    // 1. Head shape (width to height ratio)
    const pHeadWidth = distX(pl.headRight, pl.headLeft);
    const pHeadHeight = distY(pl.chin, pl.foreheadTop);
    const pHeadShape = pHeadWidth / (pHeadHeight || 1);

    const sHeadWidth = distX(sl.headRight, sl.headLeft);
    const sHeadHeight = distY(sl.chin, sl.foreheadTop);
    const sHeadShape = sHeadWidth / (sHeadHeight || 1);

    const headShapeScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(pHeadShape - sHeadShape) * 150)));

    // Midpoint Y values for precise vertical spacing
    const pEyeY = (pl.leftEyeCenter.y + pl.rightEyeCenter.y) / 2;
    const pNoseY = (pl.noseLeft.y + pl.noseRight.y) / 2;

    const sEyeY = (sl.leftEyeCenter.y + sl.rightEyeCenter.y) / 2;
    const sNoseY = (sl.noseLeft.y + sl.noseRight.y) / 2;

    // 2a. Eye-to-Nose relative vertical distance (scaled by total head height)
    const pEyeToNoseVal = Math.abs(pEyeY - pNoseY) / (pHeadHeight || 1);
    const sEyeToNoseVal = Math.abs(sEyeY - sNoseY) / (sHeadHeight || 1);
    const eyeToNoseScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(pEyeToNoseVal - sEyeToNoseVal) * 500)));

    // 2c. Top-of-Head to Eye Center distance (scaled by total head height)
    const pHeadToEyeVal = Math.abs(pl.foreheadTop.y - pEyeY) / (pHeadHeight || 1);
    const sHeadToEyeVal = Math.abs(sl.foreheadTop.y - sEyeY) / (sHeadHeight || 1);
    const headToEyeScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(pHeadToEyeVal - sHeadToEyeVal) * 450)));

    // 2d. Top-of-Head to Nose distance (scaled by total head height)
    const pHeadToNoseVal = Math.abs(pl.foreheadTop.y - pNoseY) / (pHeadHeight || 1);
    const sHeadToNoseVal = Math.abs(sl.foreheadTop.y - sNoseY) / (sHeadHeight || 1);
    const headToNoseScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(pHeadToNoseVal - sHeadToNoseVal) * 450)));

    // 3. Eye Center Width vs head width
    const pIPD = distX(pl.rightEyeCenter, pl.leftEyeCenter);
    const pEyeRatio = pIPD / (pHeadWidth || 1);

    const sIPD = distX(sl.rightEyeCenter, sl.leftEyeCenter);
    const sEyeRatio = sIPD / (sHeadWidth || 1);

    const eyeScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(pEyeRatio - sEyeRatio) * 300)));

    // 4. Nose width vs head width
    const pNoseW = distX(pl.noseRight, pl.noseLeft);
    const pNoseRatio = pNoseW / (pHeadWidth || 1);

    const sNoseW = distX(sl.noseRight, sl.noseLeft);
    const sNoseRatio = sNoseW / (sHeadWidth || 1);

    const noseScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(pNoseRatio - sNoseRatio) * 400)));

    // 5. Mouth width vs head width
    const pMouthW = distX(pl.mouthRight, pl.mouthLeft);
    const pMouthRatio = pMouthW / (pHeadWidth || 1);

    const sMouthW = distX(sl.mouthRight, sl.mouthLeft);
    const sMouthRatio = sMouthW / (sHeadWidth || 1);

    const mouthScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(pMouthRatio - sMouthRatio) * 300)));

    // 6. Eye to side of head distance ratio
    const pEyeToSideRatio = ((pl.leftEyeCenter.x - pl.headLeft.x) + (pl.headRight.x - pl.rightEyeCenter.x)) / (2 * (pHeadWidth || 1));
    const sEyeToSideRatio = ((sl.leftEyeCenter.x - sl.headLeft.x) + (sl.headRight.x - sl.rightEyeCenter.x)) / (2 * (sHeadWidth || 1));
    const eyeToSideScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(pEyeToSideRatio - sEyeToSideRatio) * 400)));

    // 7. Nose to side of head distance ratio
    const pNoseToSideRatio = ((pl.noseLeft.x - pl.headLeft.x) + (pl.headRight.x - pl.noseRight.x)) / (2 * (pHeadWidth || 1));
    const sNoseToSideRatio = ((sl.noseLeft.x - sl.headLeft.x) + (sl.headRight.x - sl.noseRight.x)) / (2 * (sHeadWidth || 1));
    const noseToSideScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(pNoseToSideRatio - sNoseToSideRatio) * 400)));

    // 8. Mouth to side of head distance ratio
    const pMouthToSideRatio = ((pl.mouthLeft.x - pl.headLeft.x) + (pl.headRight.x - pl.mouthRight.x)) / (2 * (pHeadWidth || 1));
    const sMouthToSideRatio = ((sl.mouthLeft.x - sl.headLeft.x) + (sl.headRight.x - sl.mouthRight.x)) / (2 * (sHeadWidth || 1));
    const mouthToSideScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(pMouthToSideRatio - sMouthToSideRatio) * 400)));

    // Overall similarity (averaged over 10 metrics)
    const overallScore = Math.round(
      (headShapeScore + 
       headToEyeScore + 
       headToNoseScore + 
       eyeToNoseScore + 
       eyeScore + 
       noseScore + 
       mouthScore +
       eyeToSideScore +
       noseToSideScore +
       mouthToSideScore) / 10
    );

    setAnalysis(prev => ({
      ...prev,
      score: overallScore,
      categories: {
        ...prev.categories,
        headShape: {
          ...prev.categories.headShape,
          score: headShapeScore,
          portraitRatio: parseFloat(pHeadShape.toFixed(2)),
          sculptureRatio: parseFloat(sHeadShape.toFixed(2)),
          feedback: headShapeScore > 90 
            ? t("Superb head width-to-height proportion match!", "สัดส่วนความกว้างต่อความสูงของศีรษะจับคู่กันได้อย่างสมบูรณ์แบบ!") 
            : t(`Head width ratio is ${sHeadShape > pHeadShape ? 'wider' : 'narrower'} (${sHeadShape.toFixed(2)}) compared to portrait reference (${pHeadShape.toFixed(2)}).`,
                `สัดส่วนความกว้างศีรษะมีขนาด${sHeadShape > pHeadShape ? 'กว้างกว่า' : 'แคบกว่า'} (${sHeadShape.toFixed(2)}) เมื่อเทียบกับภาพต้นแบบอ้างอิง (${pHeadShape.toFixed(2)})`)
        },
        headToEyeDistance: {
          score: headToEyeScore,
          portraitRatio: parseFloat((pHeadToEyeVal * 100).toFixed(1)),
          sculptureRatio: parseFloat((sHeadToEyeVal * 100).toFixed(1)),
          unit: "% of head height",
          feedback: headToEyeScore > 90
            ? t("Top of head to eye vertical position is perfectly matched!", "ตำแหน่งดวงตาเทียบกับส่วนบนสุดของศีรษะมีความแม่นยำอย่างสมบูรณ์แบบ!")
            : t(`Top of head to eye distance is ${sHeadToEyeVal > pHeadToEyeVal ? 'too long' : 'too short'} (${(sHeadToEyeVal*100).toFixed(1)}% of head height) vs portrait reference (${(pHeadToEyeVal*100).toFixed(1)}%).`,
                `ระยะห่างดวงตาถึงส่วนบนของศีรษะมีสัดส่วน${sHeadToEyeVal > pHeadToEyeVal ? 'ยาวเกินไป' : 'สั้นเกินไป'} (${(sHeadToEyeVal*100).toFixed(1)}% ของความสูงศีรษะ) เมื่อเทียบกับภาพต้นแบบอ้างอิง (${(pHeadToEyeVal*100).toFixed(1)}%)`)
        },
        headToNoseDistance: {
          score: headToNoseScore,
          portraitRatio: parseFloat((pHeadToNoseVal * 100).toFixed(1)),
          sculptureRatio: parseFloat((sHeadToNoseVal * 100).toFixed(1)),
          unit: "% of head height",
          feedback: headToNoseScore > 90
            ? t("Top of head to nose vertical position is perfectly matched!", "ตำแหน่งจมูกเทียบกับส่วนบนสุดของศีรษะมีความแม่นยำอย่างสมบูรณ์แบบ!")
            : t(`Top of head to nose distance is ${sHeadToNoseVal > pHeadToNoseVal ? 'too long' : 'too short'} (${(sHeadToNoseVal*100).toFixed(1)}% of head height) vs portrait reference (${(pHeadToNoseVal*100).toFixed(1)}%).`,
                `ระยะห่างจมูกถึงส่วนบนของศีรษะมีสัดส่วน${sHeadToNoseVal > pHeadToNoseVal ? 'ยาวเกินไป' : 'สั้นเกินไป'} (${(sHeadToNoseVal*100).toFixed(1)}% ของความสูงศีรษะ) เมื่อเทียบกับภาพต้นแบบอ้างอิง (${(pHeadToNoseVal*100).toFixed(1)}%)`)
        },
        eyeToNoseDistance: {
          score: eyeToNoseScore,
          portraitRatio: parseFloat((pEyeToNoseVal * 100).toFixed(1)),
          sculptureRatio: parseFloat((sEyeToNoseVal * 100).toFixed(1)),
          unit: "% of head height",
          feedback: eyeToNoseScore > 90
            ? t("Perfect nose-to-eye vertical spacing!", "ระยะห่างแนวตั้งระหว่างจมูกกับดวงตามีสัดส่วนตรงกันอย่างสมบูรณ์แบบ!")
            : t(`Nose-to-eye distance is ${sEyeToNoseVal > pEyeToNoseVal ? 'too long' : 'too short'} (${(sEyeToNoseVal*100).toFixed(1)}% of head height) vs portrait reference (${(pEyeToNoseVal*100).toFixed(1)}%).`,
                `ระยะห่างจมูกถึงดวงตามีสัดส่วน${sEyeToNoseVal > pEyeToNoseVal ? 'ยาวเกินไป' : 'สั้นเกินไป'} (${(sEyeToNoseVal*100).toFixed(1)}% ของความสูงศีรษะ) เมื่อเทียบกับภาพต้นแบบอ้างอิง (${(pEyeToNoseVal*100).toFixed(1)}%)`)
        },
        eyeCenterWidth: {
          ...prev.categories.eyeCenterWidth,
          score: eyeScore,
          portraitRatio: parseFloat(pEyeRatio.toFixed(2)),
          sculptureRatio: parseFloat(sEyeRatio.toFixed(2)),
          feedback: eyeScore > 90 
            ? t("Pupil width is perfectly proportional.", "ความกว้างระหว่างรูม่านตาจับคู่กันได้อย่างสมบูรณ์แบบ") 
            : t(`Interpupillary distance is ${sEyeRatio > pEyeRatio ? 'too wide' : 'too narrow'} (${(sEyeRatio*100).toFixed(0)}% of head width) compared to reference (${(pEyeRatio*100).toFixed(0)}%).`,
                `ระยะห่างระหว่างตาข้างมีลักษณะ${sEyeRatio > pEyeRatio ? 'กว้างเกินไป' : 'แคบเกินไป'} (${(sEyeRatio*100).toFixed(0)}% ของความกว้างศีรษะ) เมื่อเทียบกับภาพอ้างอิง (${(pEyeRatio*100).toFixed(0)}%)`)
        },
        noseWidth: {
          ...prev.categories.noseWidth,
          score: noseScore,
          portraitRatio: parseFloat(pNoseRatio.toFixed(2)),
          sculptureRatio: parseFloat(sNoseRatio.toFixed(2)),
          feedback: noseScore > 90 
            ? t("Nose width matches reference perfectly!", "ความกว้างของจมูกตรงกับภาพต้นแบบอ้างอิงอย่างสมบูรณ์แบบ!") 
            : t(`Nose alar width is ${sNoseRatio > pNoseRatio ? 'too wide' : 'too narrow'} (${(sNoseRatio*100).toFixed(0)}% of face) vs reference (${(pNoseRatio*100).toFixed(0)}%).`,
                `ฐานปีกจมูกมีขนาด${sNoseRatio > pNoseRatio ? 'กว้างเกินไป' : 'แคบเกินไป'} (${(sNoseRatio*100).toFixed(0)}% ของความกว้างหน้า) เมื่อเทียบกับภาพอ้างอิง (${(pNoseRatio*100).toFixed(0)}%)`)
        },
        mouthWidth: {
          ...prev.categories.mouthWidth,
          score: mouthScore,
          portraitRatio: parseFloat(pMouthRatio.toFixed(2)),
          sculptureRatio: parseFloat(sMouthRatio.toFixed(2)),
          feedback: mouthScore > 90 
            ? t("Mouth width is outstandingly aligned.", "ความกว้างของปากจัดวางในสัดส่วนที่สอดคล้องอย่างสมบูรณ์แบบ") 
            : t(`Mouth width is ${sMouthRatio > pMouthRatio ? 'too wide' : 'too narrow'} (${(sMouthRatio*100).toFixed(0)}% of face) vs reference (${(pMouthRatio*100).toFixed(0)}%).`,
                `ความกว้างของปากมีขนาด${sMouthRatio > pMouthRatio ? 'กว้างเกินไป' : 'แคบเกินไป'} (${(sMouthRatio*100).toFixed(0)}% ของความกว้างหน้า) เมื่อเทียบกับภาพอ้างอิง (${(pMouthRatio*100).toFixed(0)}%)`)
        },
        eyeToSideDistance: {
          score: eyeToSideScore,
          portraitRatio: parseFloat(pEyeToSideRatio.toFixed(2)),
          sculptureRatio: parseFloat(sEyeToSideRatio.toFixed(2)),
          unit: t("Ratio to Head Width", "อัตราส่วนต่อความกว้างศีรษะ"),
          feedback: eyeToSideScore > 90
            ? t("Eye lateral positioning relative to skull sides matches perfectly!", "ตำแหน่งดวงตาในแนวราบเมื่อเทียบกับกรอบศีรษะตรงกันอย่างสมบูรณ์แบบ!")
            : t(`Eye-to-side distance is ${sEyeToSideRatio > pEyeToSideRatio ? 'wider' : 'narrower'} (${sEyeToSideRatio.toFixed(2)}) vs portrait reference (${pEyeToSideRatio.toFixed(2)}).`,
                `ระยะตาถึงข้างศีรษะมีความ${sEyeToSideRatio > pEyeToSideRatio ? 'กว้างกว่า' : 'แคบกว่า'} (${sEyeToSideRatio.toFixed(2)}) เมื่อเทียบกับภาพอ้างอิง (${pEyeToSideRatio.toFixed(2)})`)
        },
        noseToSideDistance: {
          score: noseToSideScore,
          portraitRatio: parseFloat(pNoseToSideRatio.toFixed(2)),
          sculptureRatio: parseFloat(sNoseToSideRatio.toFixed(2)),
          unit: t("Ratio to Head Width", "อัตราส่วนต่อความกว้างศีรษะ"),
          feedback: noseToSideScore > 90
            ? t("Nose lateral margins to head shape profile match perfectly!", "ตำแหน่งจมูกในแนวราบเมื่อเทียบกับกรอบศีรษะตรงกันอย่างสมบูรณ์แบบ!")
            : t(`Nose-to-side distance is ${sNoseToSideRatio > pNoseToSideRatio ? 'wider' : 'narrower'} (${sNoseToSideRatio.toFixed(2)}) vs portrait reference (${pNoseToSideRatio.toFixed(2)}).`,
                `ระยะจมูกถึงข้างศีรษะมีความ${sNoseToSideRatio > pNoseToSideRatio ? 'กว้างกว่า' : 'แคบกว่า'} (${sNoseToSideRatio.toFixed(2)}) เมื่อเทียบกับภาพอ้างอิง (${pNoseToSideRatio.toFixed(2)})`)
        },
        mouthToSideDistance: {
          score: mouthToSideScore,
          portraitRatio: parseFloat(pMouthToSideRatio.toFixed(2)),
          sculptureRatio: parseFloat(sMouthToSideRatio.toFixed(2)),
          unit: t("Ratio to Head Width", "อัตราส่วนต่อความกว้างศีรษะ"),
          feedback: mouthToSideScore > 90
            ? t("Mouth lateral placement relative to outer skull profile matches perfectly!", "ตำแหน่งปากในแนวราบเมื่อเทียบกับกรอบศีรษะตรงกันอย่างสมบูรณ์แบบ!")
            : t(`Mouth-to-side distance is ${sMouthToSideRatio > pMouthToSideRatio ? 'wider' : 'narrower'} (${sMouthToSideRatio.toFixed(2)}) vs portrait reference (${pMouthToSideRatio.toFixed(2)}).`,
                `ระยะปากถึงข้างศีรษะมีความ${sMouthToSideRatio > pMouthToSideRatio ? 'กว้างกว่า' : 'แคบกว่า'} (${sMouthToSideRatio.toFixed(2)}) เมื่อเทียบกับภาพอ้างอิง (${pMouthToSideRatio.toFixed(2)})`)
        }
      }
    }));
  };

  useEffect(() => {
    handleRecalculateRatios();
  }, [language]);

  // Start Manual Placement Mode
  const startManualPlacement = (target: 'portrait' | 'sculpture') => {
    setPlacementState({
      active: true,
      target,
      stepIndex: 0
    });
    setShowLandmarks(true);
  };

  const cancelManualPlacement = () => {
    setPlacementState({
      active: false,
      target: null,
      stepIndex: 0
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>, containerRef: React.RefObject<HTMLDivElement | null>, target: 'portrait' | 'sculpture') => {
    if (!placementState.active || placementState.target !== target || !containerRef.current) return;

    // Prevent handling click if we are actually dragging a point
    if (draggedPoint) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1000, Math.round(((e.clientX - rect.left) / rect.width) * 1000)));
    const y = Math.max(0, Math.min(1000, Math.round(((e.clientY - rect.top) / rect.height) * 1000)));

    const activeKey = LANDMARK_SEQUENCE[placementState.stepIndex].key;

    setAnalysis(prev => {
      const landmarksObj = target === 'portrait' ? prev.portraitLandmarks : prev.sculptureLandmarks;
      const updatedLandmarks = {
        ...landmarksObj,
        [activeKey]: { x, y }
      };

      return {
        ...prev,
        [target === 'portrait' ? 'portraitLandmarks' : 'sculptureLandmarks']: updatedLandmarks
      };
    });

    if (placementState.stepIndex < LANDMARK_SEQUENCE.length - 1) {
      setPlacementState(prev => ({
        ...prev,
        stepIndex: prev.stepIndex + 1
      }));
    } else {
      // Completed placement!
      setPlacementState({
        active: false,
        target: null,
        stepIndex: 0
      });
      isManualChangeRef.current = true;
    }
  };

  // Handle Drag Landmarks
  const startDrag = (type: 'portrait' | 'sculpture', key: keyof Landmarks) => {
    setDraggedPoint({ type, key });
  };

  const onDrag = (e: React.MouseEvent<HTMLDivElement>, containerRef: React.RefObject<HTMLDivElement | null>) => {
    if (!draggedPoint || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1000, Math.round(((e.clientX - rect.left) / rect.width) * 1000)));
    const y = Math.max(0, Math.min(1000, Math.round(((e.clientY - rect.top) / rect.height) * 1000)));

    isManualChangeRef.current = true;
    setAnalysis(prev => {
      const landmarksObj = draggedPoint.type === 'portrait' ? prev.portraitLandmarks : prev.sculptureLandmarks;
      const updatedLandmarks = {
        ...landmarksObj,
        [draggedPoint.key]: { x, y }
      };

      return {
        ...prev,
        [draggedPoint.type === 'portrait' ? 'portraitLandmarks' : 'sculptureLandmarks']: updatedLandmarks
      };
    });
  };

  const onTouchDrag = (e: React.TouchEvent<HTMLDivElement>, containerRef: React.RefObject<HTMLDivElement | null>) => {
    if (!draggedPoint || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(1000, Math.round(((touch.clientX - rect.left) / rect.width) * 1000)));
    const y = Math.max(0, Math.min(1000, Math.round(((touch.clientY - rect.top) / rect.height) * 1000)));

    isManualChangeRef.current = true;
    setAnalysis(prev => {
      const landmarksObj = draggedPoint.type === 'portrait' ? prev.portraitLandmarks : prev.sculptureLandmarks;
      const updatedLandmarks = {
        ...landmarksObj,
        [draggedPoint.key]: { x, y }
      };
      return {
        ...prev,
        [draggedPoint.type === 'portrait' ? 'portraitLandmarks' : 'sculptureLandmarks']: updatedLandmarks
      };
    });
  };

  const endDrag = () => {
    if (draggedPoint) {
      setDraggedPoint(null);
    }
  };

  // Reset current custom landmarks to default face-like positions
  const resetLandmarks = () => {
    isManualChangeRef.current = true;
    setAnalysis(prev => ({
      ...prev,
      portraitLandmarks: {
        foreheadTop: { x: 500, y: 150 },
        chin: { x: 500, y: 880 },
        leftEyeCenter: { x: 380, y: 380 },
        rightEyeCenter: { x: 620, y: 380 },
        noseLeft: { x: 440, y: 560 },
        noseRight: { x: 560, y: 560 },
        mouthLeft: { x: 410, y: 710 },
        mouthRight: { x: 590, y: 710 },
        headLeft: { x: 250, y: 500 },
        headRight: { x: 750, y: 500 }
      },
      sculptureLandmarks: {
        foreheadTop: { x: 500, y: 160 },
        chin: { x: 495, y: 850 },
        leftEyeCenter: { x: 370, y: 390 },
        rightEyeCenter: { x: 610, y: 390 },
        noseLeft: { x: 430, y: 580 },
        noseRight: { x: 570, y: 580 },
        mouthLeft: { x: 400, y: 730 },
        mouthRight: { x: 580, y: 730 },
        headLeft: { x: 230, y: 500 },
        headRight: { x: 770, y: 500 }
      }
    }));
  };

  const buildSaveData = (includeImages: boolean): ProjectSaveData => ({
    version: 1,
    portraitImg: includeImages ? portraitImg : '',
    sculptureImg: includeImages ? sculptureImg : '',
    portraitAspectRatio,
    sculptureAspectRatio,
    analysis,
    activePresetId,
    isCustom,
    showGrid,
    gridDensity,
    gridColor,
    gridOpacity,
    showLandmarks,
    language,
  });

  const saveToLocalStorage = () => {
    try {
      const data = buildSaveData(true);
      const serialized = JSON.stringify(data);
      localStorage.setItem(SAVE_KEY, serialized);
    } catch {
      try {
        const data = buildSaveData(false);
        const serialized = JSON.stringify(data);
        localStorage.setItem(SAVE_KEY, serialized);
      } catch { /* localStorage unavailable */ }
    }
  };

  const loadFromLocalStorage = (): ProjectSaveData | null => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const clearSavedProject = () => {
    localStorage.removeItem(SAVE_KEY);
  };

  const scheduleSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(saveToLocalStorage, 400);
  };

  const exportProjectFile = () => {
    const data = buildSaveData(true);
    data.version = 1;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `sculpture-project-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProjectFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data: ProjectSaveData = JSON.parse(e.target?.result as string);
        if (!data.analysis || !data.analysis.portraitLandmarks) return;
        setPortraitImg(data.portraitImg || PRESETS[0].portrait);
        setSculptureImg(data.sculptureImg || PRESETS[0].sculpture);
        setPortraitAspectRatio(data.portraitAspectRatio || 1);
        setSculptureAspectRatio(data.sculptureAspectRatio || 1);
        setAnalysis(data.analysis);
        setActivePresetId(data.activePresetId || '');
        setIsCustom(data.isCustom || false);
        setShowGrid(data.showGrid ?? true);
        setGridDensity(data.gridDensity ?? 12);
        setGridColor(data.gridColor || "#3B82F6");
        setGridOpacity(data.gridOpacity ?? 30);
        setShowLandmarks(data.showLandmarks ?? true);
        if (data.language) setLanguage(data.language);
      } catch { /* invalid file */ }
    };
    reader.readAsText(file);
  };

  const tryRestoreSession = () => {
    const saved = loadFromLocalStorage();
    if (!saved) return;
    if (saved.activePresetId) {
      const preset = PRESETS.find(p => p.id === saved.activePresetId);
      if (preset) {
        setPortraitImg(preset.portrait);
        setSculptureImg(preset.sculpture);
      }
    }
    if (!saved.portraitImg && !saved.activePresetId) {
      setShowRestoreBanner(true);
      return;
    }
    if (saved.portraitImg) setPortraitImg(saved.portraitImg);
    if (saved.sculptureImg) setSculptureImg(saved.sculptureImg);
    setPortraitAspectRatio(saved.portraitAspectRatio || 1);
    setSculptureAspectRatio(saved.sculptureAspectRatio || 1);
    setAnalysis(saved.analysis);
    setActivePresetId(saved.activePresetId || '');
    setIsCustom(saved.isCustom || false);
    setShowGrid(saved.showGrid ?? true);
    setGridDensity(saved.gridDensity ?? 12);
    setGridColor(saved.gridColor || "#3B82F6");
    setGridOpacity(saved.gridOpacity ?? 30);
    setShowLandmarks(saved.showLandmarks ?? true);
    if (saved.language) setLanguage(saved.language);
  };

  const containerRefPortrait = useRef<HTMLDivElement>(null);
  const containerRefSculpture = useRef<HTMLDivElement>(null);
  const isManualChangeRef = useRef<boolean>(false);

  // Auto recal on mount + check for saved session
  useEffect(() => {
    handleRecalculateRatios();
    tryRestoreSession();
  }, []);

  // Handle manual interaction updates
  useEffect(() => {
    if (isManualChangeRef.current) {
      handleRecalculateRatios();
      isManualChangeRef.current = false;
    }
  }, [analysis.portraitLandmarks, analysis.sculptureLandmarks]);

  // Auto-save on analysis/settings changes (debounced)
  useEffect(() => {
    scheduleSave();
  }, [
    analysis, showGrid, gridDensity, gridColor, gridOpacity, showLandmarks,
    activePresetId, isCustom, portraitAspectRatio, sculptureAspectRatio, language
  ]);

  const isLineRelatedToCategory = (lineKey: string, categoryKey: string | null): boolean => {
    if (!categoryKey) return false;
    switch (categoryKey) {
      case "headShape":
        return lineKey === "headWidth" || lineKey === "headHeight";
      case "eyeToNoseDistance":
        return lineKey === "headHeight" || lineKey === "eyeToNoseHeight";
      case "headToEyeDistance":
        return lineKey === "headHeight" || lineKey === "headToEyeHeight";
      case "headToNoseDistance":
        return lineKey === "headHeight" || lineKey === "headToNoseHeight";
      case "eyeCenterWidth":
        return lineKey === "headWidth" || lineKey === "eyeWidth";
      case "noseWidth":
        return lineKey === "headWidth" || lineKey === "noseWidth";
      case "mouthWidth":
        return lineKey === "headWidth" || lineKey === "mouthWidth";
      case "eyeToSideDistance":
        return lineKey === "headWidth" || lineKey === "eyeToSideLeft" || lineKey === "eyeToSideRight";
      case "noseToSideDistance":
        return lineKey === "headWidth" || lineKey === "noseToSideLeft" || lineKey === "noseToSideRight";
      case "mouthToSideDistance":
        return lineKey === "headWidth" || lineKey === "mouthToSideLeft" || lineKey === "mouthToSideRight";
      default:
        return false;
    }
  };

  const renderGuideLine = (
    x1: string, y1: string,
    x2: string, y2: string,
    lineKey: string,
    defaultColor: string,
    defaultDash: string
  ) => {
    const activeKey = heldCategoryKey || selectedCategoryKey;
    const isRelated = isLineRelatedToCategory(lineKey, activeKey);
    const isAnyActive = activeKey !== null;

    const isDetailLine = [
      "eyeToNoseHeight", "headToEyeHeight", "headToNoseHeight",
      "eyeToSideLeft", "eyeToSideRight",
      "noseToSideLeft", "noseToSideRight",
      "mouthToSideLeft", "mouthToSideRight"
    ].includes(lineKey);
    if (isDetailLine && (!isAnyActive || !isRelated)) {
      return null;
    }

    let strokeColor = defaultColor;
    let strokeWidth = "1.5";
    let opacityClass = "opacity-50";
    let showGlow = false;

    if (isAnyActive) {
      if (isRelated) {
        const isDotted = defaultDash !== "";
        strokeColor = isDotted ? "#F59E0B" : "#EF4444";
        strokeWidth = "2.5";
        opacityClass = "opacity-100";
        showGlow = true;
      } else {
        strokeWidth = "1";
        opacityClass = "opacity-10";
      }
    }

    return (
      <g key={lineKey}>
        <line 
          x1={x1} y1={y1} x2={x2} y2={y2} 
          stroke={strokeColor} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={defaultDash}
          className={`transition-all duration-300 ${showGlow ? "opacity-35" : "opacity-0 pointer-events-none"}`}
        />
        <line 
          x1={x1} y1={y1} x2={x2} y2={y2} 
          stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={defaultDash}
          className={`${opacityClass} transition-all duration-300`}
        />
      </g>
    );
  };

  return (
    <div id="sculpture-analyzer" className="w-full min-h-screen bg-[#0F1115] text-[#E0E2E5] font-sans flex flex-col overflow-x-hidden select-none">
      {/* Top Header */}
      <header className="h-14 border-b border-[#2D3139] flex items-center justify-between px-6 bg-[#16181D]">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-[#3B82F6] rounded flex items-center justify-center">
            <Layers className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              {t("SCULPT-CHECK", "ตัววิเคราะห์สัดส่วน")} <span className="text-[#3B82F6] font-normal text-xs bg-[#1E2229] px-2 py-0.5 rounded border border-[#2D3139]">{t("PRO ANALYZER", "รูปปั้นดินรุ่นโปร")}</span>
            </span>
          </div>
        </div>

        {/* Global Preset Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#A0A4AB] hidden md:inline">{t("TRY PRESET REFERENCE:", "ลองใช้ตัวอย่างอ้างอิง:")}</span>
          <div className="flex space-x-1 bg-[#090A0D] p-1 rounded-lg border border-[#2D3139]">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset)}
                className={`px-3 py-1 text-xs font-medium rounded transition-all duration-150 ${
                  activePresetId === preset.id
                    ? "bg-[#3B82F6] text-white shadow-md"
                    : "text-[#A0A4AB] hover:text-white"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Uploads and Customizations Panel */}
        <aside className="w-full lg:w-72 border-r border-[#2D3139] bg-[#16181D] flex flex-col p-4 space-y-5 overflow-y-auto shrink-0">
          
          {/* Section: Upload & Source */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-[#A0A4AB] uppercase tracking-widest flex items-center justify-between">
              <span>{t("FACIAL TARGETS", "แหล่งที่มาภาพใบหน้า")}</span>
              {isCustom && (
                <span className="text-amber-400 font-semibold text-[9px] lowercase bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  {t("custom files", "ไฟล์อัปโหลดเอง")}
                </span>
              )}
            </h3>

            {/* Portrait Upload Box */}
            <div className="space-y-1">
              <label className="text-xs text-[#A0A4AB] flex items-center justify-between">
                <span>{t("1. Reference Portrait", "1. ภาพอ้างอิงพอร์ตเทรต")}</span>
                <span className="text-[9px] text-[#6A6E77]">{t("(Front-facing photo)", "(ภาพหน้าตรง)")}</span>
              </label>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'portrait')}
                  id="portrait-upload"
                  className="hidden"
                />
                <label
                  htmlFor="portrait-upload"
                  className="flex items-center justify-center gap-2 h-16 w-full bg-[#1E2229] hover:bg-[#252A33] border border-dashed border-[#2D3139] hover:border-[#3B82F6] rounded-lg cursor-pointer transition-all"
                >
                  <Upload className="w-4 h-4 text-[#A0A4AB] group-hover:text-[#3B82F6]" />
                  <span className="text-xs font-medium text-[#A0A4AB] group-hover:text-white truncate max-w-[80%]">
                    {isCustom ? t("Change Portrait", "เปลี่ยนภาพต้นแบบ") : t("Upload Reference Portrait", "อัปโหลดภาพต้นแบบ")}
                  </span>
                </label>
              </div>
            </div>

            {/* Sculpture Upload Box */}
            <div className="space-y-1">
              <label className="text-xs text-[#A0A4AB] flex items-center justify-between">
                <span>{t("2. Sculpture Image", "2. ภาพถ่ายรูปปั้น")}</span>
                <span className="text-[9px] text-[#6A6E77]">{t("(Matches reference angle)", "(ถ่ายมุมตรงกัน)")}</span>
              </label>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'sculpture')}
                  id="sculpture-upload"
                  className="hidden"
                />
                <label
                  htmlFor="sculpture-upload"
                  className="flex items-center justify-center gap-2 h-16 w-full bg-[#1E2229] hover:bg-[#252A33] border border-dashed border-[#2D3139] hover:border-[#3B82F6] rounded-lg cursor-pointer transition-all"
                >
                  <Upload className="w-4 h-4 text-[#A0A4AB] group-hover:text-[#3B82F6]" />
                  <span className="text-xs font-medium text-[#A0A4AB] group-hover:text-white truncate max-w-[80%]">
                    {isCustom ? t("Change Sculpture", "เปลี่ยนภาพรูปปั้น") : t("Upload Sculpture Image", "อัปโหลดภาพถ่ายรูปปั้น")}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Section: Grid & Overlays */}
          <div className="space-y-3 border-t border-[#2D3139] pt-4">
            <h3 className="text-[10px] font-bold text-[#A0A4AB] uppercase tracking-widest flex items-center justify-between">
              <span>{t("GRID SETTINGS", "การตั้งค่าเส้นกริด")}</span>
              <button 
                onClick={() => setShowGrid(!showGrid)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                  showGrid ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#252A33] text-[#A0A4AB]"
                }`}
              >
                {showGrid ? t("ON", "เปิด") : t("OFF", "ปิด")}
              </button>
            </h3>

            {showGrid && (
              <div className="space-y-3.5 bg-[#090A0D]/30 p-2.5 rounded-lg border border-[#2D3139] text-xs">
                {/* Density */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[#A0A4AB]">
                    <span>{t("Grid Density", "ความหนาแน่นของเส้นกริด")}</span>
                    <span className="font-mono">{gridDensity} {t("divisions", "ช่อง")}</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="30"
                    value={gridDensity}
                    onChange={(e) => setGridDensity(parseInt(e.target.value))}
                    className="w-full accent-[#3B82F6] h-1 bg-[#1E2229] rounded"
                  />
                </div>

                {/* Opacity */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[#A0A4AB]">
                    <span>{t("Grid Opacity", "ความโปร่งใสของเส้นกริด")}</span>
                    <span className="font-mono">{gridOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={gridOpacity}
                    onChange={(e) => setGridOpacity(parseInt(e.target.value))}
                    className="w-full accent-[#3B82F6] h-1 bg-[#1E2229] rounded"
                  />
                </div>

                {/* Color Selector */}
                <div className="space-y-1">
                  <span className="text-[11px] text-[#A0A4AB]">{t("Grid Line Color", "สีเส้นกริด")}</span>
                  <div className="flex items-center space-x-1.5 pt-1">
                    {[
                      { color: "#3B82F6", label: t("Blue", "น้ำเงิน") },
                      { color: "#10B981", label: t("Green", "เขียว") },
                      { color: "#EF4444", label: t("Red", "แดง") },
                      { color: "#F59E0B", label: t("Amber", "ส้มเหลือง") },
                      { color: "#EC4899", label: t("Pink", "ชมพู") },
                      { color: "#FFFFFF", label: t("White", "ขาว") }
                    ].map((item) => (
                      <button
                        key={item.color}
                        onClick={() => setGridColor(item.color)}
                        className={`w-5 h-5 rounded-full border transition-all ${
                          gridColor === item.color
                            ? "border-white scale-125 ring-2 ring-[#3B82F6]/30"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: item.color }}
                        title={item.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Show/Hide Landmarks Toggle */}
            <div className="flex items-center justify-between text-xs bg-[#090A0D]/50 p-2.5 rounded-lg border border-[#2D3139]">
              <span className="text-[#A0A4AB]">{t("Anatomical Landmarks", "พินตำแหน่งโครงสร้างใบหน้า")}</span>
              <button
                onClick={() => setShowLandmarks(!showLandmarks)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  showLandmarks ? "bg-[#3B82F6] text-white" : "bg-[#1E2229] text-[#A0A4AB]"
                }`}
              >
                {showLandmarks ? t("Shown", "แสดง") : t("Hidden", "ซ่อน")}
              </button>
            </div>

            {/* Manual Placement Section */}
            <div className="space-y-2 border-t border-[#2D3139] pt-4">
              <h3 className="text-[10px] font-bold text-[#A0A4AB] uppercase tracking-widest">
                {t("MANUAL PLACEMENT", "การปักพินด้วยตนเอง")}
              </h3>
              <div className="text-[11px] text-[#A0A4AB] leading-relaxed pb-1">
                {t("Bypass the AI and place the 10 landmarks manually from scratch by clicking on the canvas.", "ข้าม AI และทำการปักพินโครงสร้างทั้ง 10 จุดด้วยตนเองโดยการคลิกบนภาพแคนวาส")}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => startManualPlacement('portrait')}
                  className={`px-2 py-2 rounded text-[11px] font-bold transition-all cursor-pointer border ${
                    placementState.active && placementState.target === 'portrait'
                      ? "bg-[#3B82F6] border-[#3B82F6] text-white"
                      : "bg-[#1E2229] border-[#2D3139] text-[#A0A4AB] hover:border-[#3B82F6] hover:text-white"
                  }`}
                >
                  {t("Place Portrait A", "ปักพินภาพต้นแบบ A")}
                </button>
                <button
                  onClick={() => startManualPlacement('sculpture')}
                  className={`px-2 py-2 rounded text-[11px] font-bold transition-all cursor-pointer border ${
                    placementState.active && placementState.target === 'sculpture'
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "bg-[#1E2229] border-[#2D3139] text-[#A0A4AB] hover:border-amber-500 hover:text-white"
                  }`}
                >
                  {t("Place Sculpture B", "ปักพินรูปปั้น B")}
                </button>
              </div>
            </div>
          </div>

          {/* Section: Project Save/Load */}
          <div className="space-y-2 border-t border-[#2D3139] pt-4">
            <h3 className="text-[10px] font-bold text-[#A0A4AB] uppercase tracking-widest">
              {t("PROJECT", "โปรเจกต์")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={exportProjectFile}
                className="flex items-center justify-center gap-1.5 px-2 py-2 rounded text-[11px] font-bold transition-all cursor-pointer border bg-[#1E2229] border-[#2D3139] text-[#A0A4AB] hover:border-[#3B82F6] hover:text-white"
              >
                {t("Export", "ส่งออก")}
              </button>
              <label
                htmlFor="project-import"
                className="flex items-center justify-center gap-1.5 px-2 py-2 rounded text-[11px] font-bold transition-all cursor-pointer border bg-[#1E2229] border-[#2D3139] text-[#A0A4AB] hover:border-amber-500 hover:text-white"
              >
                {t("Import", "นำเข้า")}
              </label>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importProjectFromFile(file);
                e.target.value = '';
              }}
              id="project-import"
              className="hidden"
            />
          </div>

          {/* Prompt info */}
          <div className="p-3 rounded-lg bg-[#1E2229] border border-[#2D3139] mt-auto">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-[#A0A4AB]">
                <strong className="text-white block mb-0.5">{t("Tip for Sculptors:", "คำแนะนำสำหรับนักประติมากร:")}</strong>
                {t("Adjust landmark pins manually anytime by dragging them in the canvas. Proportion ratios update instantly to reflect your changes!", "คุณสามารถปรับจุดพินตำแหน่งโครงสร้างได้ตลอดเวลาโดยการลากพวกมันบนภาพแคนวาส อัตราส่วนความสมดุลจะถูกคำนวณและอัปเดตทันที!")}
              </div>
            </div>
          </div>
        </aside>

        {/* Middle Area: Core Visual Canvas Viewport */}
        <div 
          className="flex-1 bg-[#090A0D] p-6 flex flex-col space-y-4 overflow-y-auto"
          onMouseMove={(e) => {
            // Calculate relative hover position for information stats in status bar
            const viewport = e.currentTarget.getBoundingClientRect();
            setHoverCoords({
              x: Math.round(((e.clientX - viewport.left) / viewport.width) * 1000),
              y: Math.round(((e.clientY - viewport.top) / viewport.height) * 1000)
            });
          }}
          onMouseLeave={() => setHoverCoords(null)}
        >
              {/* Restore Session Banner */}
              {showRestoreBanner && (
                <div className="bg-[#1D212A] border border-amber-500/30 p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 animate-fade-in z-20">
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">{t("Resume previous session?", "กลับไปทำงานต่อ?")}</div>
                      <div className="text-[12px] text-[#A0A4AB]">
                        {t("Your previous analysis is saved. Upload your custom images again to restore.", "มีการบันทึกข้อมูลการวิเคราะห์ครั้งก่อน อัปโหลดภาพของคุณอีกครั้งเพื่อกู้คืน")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowRestoreBanner(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2C313B] text-[#A0A4AB] hover:bg-[#373D4B] hover:text-white transition-all cursor-pointer"
                    >
                      {t("Dismiss", "ปิด")}
                    </button>
                  </div>
                </div>
              )}

              {/* Manual Placement Guided Banner */}
              {placementState.active && placementState.target && (
               <div className="bg-[#1D212A] border border-[#3B82F6]/30 p-4 rounded-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in z-20">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] font-bold">
                     {placementState.stepIndex + 1}
                   </div>
                   <div>
                     <div className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                       <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                       Place Landmark on {placementState.target === 'portrait' ? 'Reference Portrait (A)' : 'Clay Sculpture (B)'}
                     </div>
                     <div className="text-[13px] text-[#A0A4AB] mt-0.5 font-medium">
                       Click on the image to place: <span className="text-[#3B82F6] font-bold">{LANDMARK_SEQUENCE[placementState.stepIndex].label}</span>
                     </div>
                     <div className="text-[11px] text-[#7C8087] mt-0.5">
                       {LANDMARK_SEQUENCE[placementState.stepIndex].description}
                     </div>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                   <button
                     onClick={() => {
                       // Skip landmark (advance index without modifying coordinate)
                       if (placementState.stepIndex < LANDMARK_SEQUENCE.length - 1) {
                         setPlacementState(prev => ({ ...prev, stepIndex: prev.stepIndex + 1 }));
                       } else {
                         setPlacementState({ active: false, target: null, stepIndex: 0 });
                         handleRecalculateRatios();
                       }
                     }}
                     className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#2C313B] text-[#A0A4AB] hover:bg-[#373D4B] hover:text-white transition-all cursor-pointer"
                   >
                     Skip Pin
                   </button>
                   <button
                     onClick={cancelManualPlacement}
                     className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer"
                   >
                     Cancel Mode
                   </button>
                 </div>
               </div>
             )}

             {/* Workspace Wrapper */}
             <div className="flex-1 min-h-[420px] flex items-center justify-center relative">
            
            {/* View Mode: SIDE-BY-SIDE */}
            {viewMode === 'side-by-side' && (
              <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* REFERENCE VIEW (A) */}
                <div 
                  onMouseMove={(e) => onDrag(e, containerRefPortrait)}
                  onMouseUp={endDrag}
                  onTouchMove={(e) => onTouchDrag(e, containerRefPortrait)}
                  onTouchEnd={endDrag}
                  className="bg-[#1A1C23] rounded-xl border border-[#2D3139] relative overflow-hidden flex flex-col shadow-lg select-none animate-fade-in"
                >
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-white z-10 border border-[#2D3139] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
                    <span>{t("A: REFERENCE PORTRAIT", "A: ภาพต้นแบบอ้างอิง")}</span>
                  </div>

                  <div className="flex-1 relative flex items-center justify-center p-3 bg-[#111317]">
                    <div 
                      ref={containerRefPortrait}
                      onClick={(e) => handleCanvasClick(e, containerRefPortrait, 'portrait')}
                      className="relative border border-[#2C313B]/40 bg-[#16181D] rounded-lg shadow-xl overflow-hidden"
                      style={{ 
                        aspectRatio: portraitAspectRatio,
                        width: '100%',
                        height: '100%',
                        maxWidth: '100%',
                        maxHeight: 'calc(100vh - 280px)', 
                        display: 'block',
                        cursor: placementState.active && placementState.target === 'portrait' ? 'crosshair' : 'default',
                        touchAction: 'none'
                      }}
                    >
                      <img 
                        src={portraitImg} 
                        alt="Portrait Reference" 
                        className="w-full h-full object-cover block pointer-events-none"
                      />
                      {/* Grid Overlays */}
                      {showGrid && (
                        <div 
                          className="absolute inset-0 pointer-events-none" 
                          style={{ 
                            backgroundImage: `
                              linear-gradient(to right, ${gridColor} 1px, transparent 1px), 
                              linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
                            `,
                            backgroundSize: `${100 / gridDensity}% ${100 / gridDensity}%`,
                            opacity: gridOpacity / 100
                          }}
                        />
                      )}

                      {/* Landmarks Pins */}
                      {showLandmarks && Object.entries(analysis.portraitLandmarks).map(([key, point]: [string, any]) => {
                        const isMain = selectedCategoryKey && isLandmarkRelatedToCategory(key, selectedCategoryKey);
                        return (
                          <div
                            key={`p-${key}`}
                            onMouseDown={() => startDrag('portrait', key as keyof Landmarks)}
                            onTouchStart={() => startDrag('portrait', key as keyof Landmarks)}
                            className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full cursor-move transition-transform duration-75 ${
                              isMain 
                                ? "bg-amber-400 border-2 border-white scale-150 z-30 ring-4 ring-amber-400/30" 
                                : "bg-[#3B82F6] border border-white z-20 hover:scale-125"
                            }`}
                            style={{ left: `${point.x / 10}%`, top: `${point.y / 10}%`, touchAction: 'none' }}
                            title={`${key}: X:${point.x} Y:${point.y}`}
                          >
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/80 text-[8px] font-mono font-semibold text-white px-1 py-0.2 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              {key}
                            </span>
                          </div>
                        );
                      })}

                      {/* Connective Anatomy Guides */}
                      {showLandmarks && (() => {
                        const pl = analysis.portraitLandmarks;
                        const pEyeY = (pl.leftEyeCenter.y + pl.rightEyeCenter.y) / 2;
                        const pNoseY = (pl.noseLeft.y + pl.noseRight.y) / 2;
                        const pMouthY = (pl.mouthLeft.y + pl.mouthRight.y) / 2;
                        const pCenterX = (pl.leftEyeCenter.x + pl.rightEyeCenter.x) / 2;

                        return (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                            {renderGuideLine(
                              `${pl.headLeft.x / 10}%`, `${pl.headLeft.y / 10}%`,
                              `${pl.headRight.x / 10}%`, `${pl.headRight.y / 10}%`,
                              "headWidth", "#3B82F6", "4 4"
                            )}
                            {renderGuideLine(
                              `${pl.foreheadTop.x / 10}%`, `${pl.foreheadTop.y / 10}%`,
                              `${pl.chin.x / 10}%`, `${pl.chin.y / 10}%`,
                              "headHeight", "#3B82F6", "4 4"
                            )}
                            {renderGuideLine(
                              `${pl.leftEyeCenter.x / 10}%`, `${pl.leftEyeCenter.y / 10}%`,
                              `${pl.rightEyeCenter.x / 10}%`, `${pl.rightEyeCenter.y / 10}%`,
                              "eyeWidth", "#10B981", ""
                            )}
                            {renderGuideLine(
                              `${pl.noseLeft.x / 10}%`, `${pl.noseLeft.y / 10}%`,
                              `${pl.noseRight.x / 10}%`, `${pl.noseRight.y / 10}%`,
                              "noseWidth", "#F59E0B", ""
                            )}
                            {renderGuideLine(
                              `${pl.mouthLeft.x / 10}%`, `${pl.mouthLeft.y / 10}%`,
                              `${pl.mouthRight.x / 10}%`, `${pl.mouthRight.y / 10}%`,
                              "mouthWidth", "#EF4444", ""
                            )}
                            {/* Eye, Nose, Mouth to Silhouette Side Spacing horizontal lines */}
                            {renderGuideLine(
                              `${pl.headLeft.x / 10}%`, `${pl.leftEyeCenter.y / 10}%`,
                              `${pl.leftEyeCenter.x / 10}%`, `${pl.leftEyeCenter.y / 10}%`,
                              "eyeToSideLeft", "#10B981", ""
                            )}
                            {renderGuideLine(
                              `${pl.rightEyeCenter.x / 10}%`, `${pl.rightEyeCenter.y / 10}%`,
                              `${pl.headRight.x / 10}%`, `${pl.rightEyeCenter.y / 10}%`,
                              "eyeToSideRight", "#10B981", ""
                            )}
                            {renderGuideLine(
                              `${pl.headLeft.x / 10}%`, `${pl.noseLeft.y / 10}%`,
                              `${pl.noseLeft.x / 10}%`, `${pl.noseLeft.y / 10}%`,
                              "noseToSideLeft", "#F59E0B", ""
                            )}
                            {renderGuideLine(
                              `${pl.noseRight.x / 10}%`, `${pl.noseRight.y / 10}%`,
                              `${pl.headRight.x / 10}%`, `${pl.noseRight.y / 10}%`,
                              "noseToSideRight", "#F59E0B", ""
                            )}
                            {renderGuideLine(
                              `${pl.headLeft.x / 10}%`, `${pl.mouthLeft.y / 10}%`,
                              `${pl.mouthLeft.x / 10}%`, `${pl.mouthLeft.y / 10}%`,
                              "mouthToSideLeft", "#EF4444", ""
                            )}
                            {renderGuideLine(
                              `${pl.mouthRight.x / 10}%`, `${pl.mouthRight.y / 10}%`,
                              `${pl.headRight.x / 10}%`, `${pl.mouthRight.y / 10}%`,
                              "mouthToSideRight", "#EF4444", ""
                            )}
                            {/* Vertical Spacing Detail Lines (Offset to prevent central overlap) */}
                            {renderGuideLine(
                              `${(pCenterX - 45) / 10}%`, `${pEyeY / 10}%`,
                              `${(pCenterX - 45) / 10}%`, `${pNoseY / 10}%`,
                              "eyeToNoseHeight", "#10B981", ""
                            )}
                            {renderGuideLine(
                              `${(pCenterX - 45) / 10}%`, `${pl.foreheadTop.y / 10}%`,
                              `${(pCenterX - 45) / 10}%`, `${pEyeY / 10}%`,
                              "headToEyeHeight", "#3B82F6", ""
                            )}
                            {renderGuideLine(
                              `${(pCenterX - 45) / 10}%`, `${pl.foreheadTop.y / 10}%`,
                              `${(pCenterX - 45) / 10}%`, `${pNoseY / 10}%`,
                              "headToNoseHeight", "#8B5CF6", ""
                            )}

                            {/* Extension horizontal lines linking offset dimension bar to center axis */}
                            {heldCategoryKey === "eyeToNoseDistance" && (
                              <g>
                                <line 
                                  x1={`${(pCenterX - 55) / 10}%`} y1={`${pEyeY / 10}%`}
                                  x2={`${pCenterX / 10}%`} y2={`${pEyeY / 10}%`}
                                  stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2"
                                />
                                <line 
                                  x1={`${(pCenterX - 55) / 10}%`} y1={`${pNoseY / 10}%`}
                                  x2={`${pCenterX / 10}%`} y2={`${pNoseY / 10}%`}
                                  stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2"
                                />
                              </g>
                            )}
                            {heldCategoryKey === "headToEyeDistance" && (
                              <g>
                                <line 
                                  x1={`${(pCenterX - 55) / 10}%`} y1={`${pl.foreheadTop.y / 10}%`}
                                  x2={`${pCenterX / 10}%`} y2={`${pl.foreheadTop.y / 10}%`}
                                  stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2"
                                />
                                <line 
                                  x1={`${(pCenterX - 55) / 10}%`} y1={`${pEyeY / 10}%`}
                                  x2={`${pCenterX / 10}%`} y2={`${pEyeY / 10}%`}
                                  stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2"
                                />
                              </g>
                            )}
                            {heldCategoryKey === "headToNoseDistance" && (
                              <g>
                                <line 
                                  x1={`${(pCenterX - 55) / 10}%`} y1={`${pl.foreheadTop.y / 10}%`}
                                  x2={`${pCenterX / 10}%`} y2={`${pl.foreheadTop.y / 10}%`}
                                  stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2"
                                />
                                <line 
                                  x1={`${(pCenterX - 55) / 10}%`} y1={`${pNoseY / 10}%`}
                                  x2={`${pCenterX / 10}%`} y2={`${pNoseY / 10}%`}
                                  stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2"
                                />
                              </g>
                            )}
                          </svg>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* SCULPTURE VIEW (B) */}
                <div 
                  onMouseMove={(e) => onDrag(e, containerRefSculpture)}
                  onMouseUp={endDrag}
                  onTouchMove={(e) => onTouchDrag(e, containerRefSculpture)}
                  onTouchEnd={endDrag}
                  className="bg-[#1A1C23] rounded-xl border border-[#2D3139] relative overflow-hidden flex flex-col shadow-lg select-none animate-fade-in"
                >
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-white z-10 border border-[#2D3139] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>{t("B: CLAY SCULPTURE", "B: รูปปั้นดินเหนียว")}</span>
                  </div>

                  <div className="flex-1 relative flex items-center justify-center p-3 bg-[#111317]">
                    <div 
                      ref={containerRefSculpture}
                      onClick={(e) => handleCanvasClick(e, containerRefSculpture, 'sculpture')}
                      className="relative border border-[#2C313B]/40 bg-[#16181D] rounded-lg shadow-xl overflow-hidden"
                      style={{ 
                        aspectRatio: sculptureAspectRatio,
                        width: '100%',
                        height: '100%',
                        maxWidth: '100%',
                        maxHeight: 'calc(100vh - 280px)', 
                        display: 'block',
                        cursor: placementState.active && placementState.target === 'sculpture' ? 'crosshair' : 'default',
                        touchAction: 'none'
                      }}
                    >
                      <img 
                        src={sculptureImg} 
                        alt="Sculpture Progress" 
                        className="w-full h-full object-cover block pointer-events-none"
                      />

                      {/* Grid Overlays */}
                      {showGrid && (
                        <div 
                          className="absolute inset-0 pointer-events-none" 
                          style={{ 
                            backgroundImage: `
                              linear-gradient(to right, ${gridColor} 1px, transparent 1px), 
                              linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
                            `,
                            backgroundSize: `${100 / gridDensity}% ${100 / gridDensity}%`,
                            opacity: gridOpacity / 100
                          }}
                        />
                      )}

                      {/* Landmarks Pins */}
                      {showLandmarks && Object.entries(analysis.sculptureLandmarks).map(([key, point]: [string, any]) => {
                        const isMain = selectedCategoryKey && isLandmarkRelatedToCategory(key, selectedCategoryKey);
                        return (
                          <div
                            key={`s-${key}`}
                            onMouseDown={() => startDrag('sculpture', key as keyof Landmarks)}
                            onTouchStart={() => startDrag('sculpture', key as keyof Landmarks)}
                            className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full cursor-move transition-transform duration-75 ${
                              isMain 
                                ? "bg-amber-400 border-2 border-white scale-150 z-30 ring-4 ring-amber-400/30" 
                                : "bg-amber-500 border border-white z-20 hover:scale-125"
                            }`}
                            style={{ left: `${point.x / 10}%`, top: `${point.y / 10}%`, touchAction: 'none' }}
                            title={`${key}: X:${point.x} Y:${point.y}`}
                          >
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/80 text-[8px] font-mono font-semibold text-white px-1 py-0.2 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              {key}
                            </span>
                          </div>
                        );
                      })}

                      {/* Connective Anatomy Guides */}
                      {showLandmarks && (() => {
                        const sl = analysis.sculptureLandmarks;
                        const sEyeY = (sl.leftEyeCenter.y + sl.rightEyeCenter.y) / 2;
                        const sNoseY = (sl.noseLeft.y + sl.noseRight.y) / 2;
                        const sMouthY = (sl.mouthLeft.y + sl.mouthRight.y) / 2;
                        const sCenterX = (sl.leftEyeCenter.x + sl.rightEyeCenter.x) / 2;

                        return (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                            {renderGuideLine(
                              `${sl.headLeft.x / 10}%`, `${sl.headLeft.y / 10}%`,
                              `${sl.headRight.x / 10}%`, `${sl.headRight.y / 10}%`,
                              "headWidth", "#3B82F6", "4 4"
                            )}
                            {renderGuideLine(
                              `${sl.foreheadTop.x / 10}%`, `${sl.foreheadTop.y / 10}%`,
                              `${sl.chin.x / 10}%`, `${sl.chin.y / 10}%`,
                              "headHeight", "#3B82F6", "4 4"
                            )}
                            {renderGuideLine(
                              `${sl.leftEyeCenter.x / 10}%`, `${sl.leftEyeCenter.y / 10}%`,
                              `${sl.rightEyeCenter.x / 10}%`, `${sl.rightEyeCenter.y / 10}%`,
                              "eyeWidth", "#10B981", ""
                            )}
                            {renderGuideLine(
                              `${sl.noseLeft.x / 10}%`, `${sl.noseLeft.y / 10}%`,
                              `${sl.noseRight.x / 10}%`, `${sl.noseRight.y / 10}%`,
                              "noseWidth", "#F59E0B", ""
                            )}
                            {renderGuideLine(
                              `${sl.mouthLeft.x / 10}%`, `${sl.mouthLeft.y / 10}%`,
                              `${sl.mouthRight.x / 10}%`, `${sl.mouthRight.y / 10}%`,
                              "mouthWidth", "#EF4444", ""
                            )}
                            {/* Eye, Nose, Mouth to Silhouette Side Spacing horizontal lines */}
                            {renderGuideLine(
                              `${sl.headLeft.x / 10}%`, `${sl.leftEyeCenter.y / 10}%`,
                              `${sl.leftEyeCenter.x / 10}%`, `${sl.leftEyeCenter.y / 10}%`,
                              "eyeToSideLeft", "#10B981", ""
                            )}
                            {renderGuideLine(
                              `${sl.rightEyeCenter.x / 10}%`, `${sl.rightEyeCenter.y / 10}%`,
                              `${sl.headRight.x / 10}%`, `${sl.rightEyeCenter.y / 10}%`,
                              "eyeToSideRight", "#10B981", ""
                            )}
                            {renderGuideLine(
                              `${sl.headLeft.x / 10}%`, `${sl.noseLeft.y / 10}%`,
                              `${sl.noseLeft.x / 10}%`, `${sl.noseLeft.y / 10}%`,
                              "noseToSideLeft", "#F59E0B", ""
                            )}
                            {renderGuideLine(
                              `${sl.noseRight.x / 10}%`, `${sl.noseRight.y / 10}%`,
                              `${sl.headRight.x / 10}%`, `${sl.noseRight.y / 10}%`,
                              "noseToSideRight", "#F59E0B", ""
                            )}
                            {renderGuideLine(
                              `${sl.headLeft.x / 10}%`, `${sl.mouthLeft.y / 10}%`,
                              `${sl.mouthLeft.x / 10}%`, `${sl.mouthLeft.y / 10}%`,
                              "mouthToSideLeft", "#EF4444", ""
                            )}
                            {renderGuideLine(
                              `${sl.mouthRight.x / 10}%`, `${sl.mouthRight.y / 10}%`,
                              `${sl.headRight.x / 10}%`, `${sl.mouthRight.y / 10}%`,
                              "mouthToSideRight", "#EF4444", ""
                            )}
                            {/* Vertical Spacing Detail Lines (Offset to prevent central overlap) */}
                            {renderGuideLine(
                              `${(sCenterX - 45) / 10}%`, `${sEyeY / 10}%`,
                              `${(sCenterX - 45) / 10}%`, `${sNoseY / 10}%`,
                              "eyeToNoseHeight", "#10B981", ""
                            )}
                            {renderGuideLine(
                              `${(sCenterX - 45) / 10}%`, `${sl.foreheadTop.y / 10}%`,
                              `${(sCenterX - 45) / 10}%`, `${sEyeY / 10}%`,
                              "headToEyeHeight", "#3B82F6", ""
                            )}
                            {renderGuideLine(
                              `${(sCenterX - 45) / 10}%`, `${sl.foreheadTop.y / 10}%`,
                              `${(sCenterX - 45) / 10}%`, `${sNoseY / 10}%`,
                              "headToNoseHeight", "#8B5CF6", ""
                            )}

                            {/* Extension horizontal lines linking offset dimension bar to center axis */}
                            {heldCategoryKey === "eyeToNoseDistance" && (
                              <g>
                                <line 
                                  x1={`${(sCenterX - 55) / 10}%`} y1={`${sEyeY / 10}%`}
                                  x2={`${sCenterX / 10}%`} y2={`${sEyeY / 10}%`}
                                  stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2"
                                />
                                <line 
                                  x1={`${(sCenterX - 55) / 10}%`} y1={`${sNoseY / 10}%`}
                                  x2={`${sCenterX / 10}%`} y2={`${sNoseY / 10}%`}
                                  stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2"
                                />
                              </g>
                            )}
                            {heldCategoryKey === "headToEyeDistance" && (
                              <g>
                                <line 
                                  x1={`${(sCenterX - 55) / 10}%`} y1={`${sl.foreheadTop.y / 10}%`}
                                  x2={`${sCenterX / 10}%`} y2={`${sl.foreheadTop.y / 10}%`}
                                  stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2"
                                />
                                <line 
                                  x1={`${(sCenterX - 55) / 10}%`} y1={`${sEyeY / 10}%`}
                                  x2={`${sCenterX / 10}%`} y2={`${sEyeY / 10}%`}
                                  stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2"
                                />
                              </g>
                            )}
                            {heldCategoryKey === "headToNoseDistance" && (
                              <g>
                                <line 
                                  x1={`${(sCenterX - 55) / 10}%`} y1={`${sl.foreheadTop.y / 10}%`}
                                  x2={`${sCenterX / 10}%`} y2={`${sl.foreheadTop.y / 10}%`}
                                  stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2"
                                />
                                <line 
                                  x1={`${(sCenterX - 55) / 10}%`} y1={`${sNoseY / 10}%`}
                                  x2={`${sCenterX / 10}%`} y2={`${sNoseY / 10}%`}
                                  stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2"
                                />
                              </g>
                            )}
                          </svg>
                        );
                      })()}
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Interactive Landmark Instructions Toolbar */}
          <div className="h-12 bg-[#16181D] rounded-lg border border-[#2D3139] flex items-center px-4 justify-between text-xs shrink-0">
            <div className="flex items-center space-x-5">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#3B82F6] rounded-full"></div>
                <span className="text-[#A0A4AB]">{t("Blue Dots: Portrait References", "จุดสีน้ำเงิน: จุดอ้างอิงภาพต้นแบบ")}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-[#A0A4AB]">{t("Orange Dots: Sculpture Marks", "จุดสีส้ม: จุดสลักบนรูปปั้น")}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={resetLandmarks}
                className="flex items-center gap-1 px-3 py-1 bg-[#1E2229] hover:bg-[#252A33] border border-[#2D3139] text-[#A0A4AB] hover:text-white rounded transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>{t("Reset Pin Layout", "รีเซ็ตพินใหม่")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Proportional Metrics, Comparison Analytics & Delta */}
        <aside className="w-full lg:w-80 border-l border-[#2D3139] bg-[#16181D] flex flex-col p-4 space-y-4 overflow-y-auto shrink-0">
          
          {/* Section: Match Score Ring */}
          <div className="bg-[#1E2229]/50 p-4 rounded-xl border border-[#2D3139] text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-500/10 text-[#3B82F6] text-[8px] font-mono px-2 py-0.5 rounded-bl uppercase">
              {t("Proportion accuracy", "ความแม่นยำของสัดส่วน")}
            </div>

            <div className="flex items-center justify-center space-x-4">
              <div className="relative flex items-center justify-center">
                {/* Score circle SVG */}
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className="stroke-[#0F1115]"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className="stroke-[#3B82F6] transition-all duration-300"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={175}
                    strokeDashoffset={175 - (175 * analysis.score) / 100}
                  />
                </svg>
                <span className="absolute text-lg font-bold text-white font-mono">
                  {analysis.score}%
                </span>
              </div>
              <div className="text-left">
                <span className="text-xs text-[#A0A4AB] uppercase tracking-wide block">{t("PROPORTIONAL SIMILARITY", "ความคล้ายคลึงสัดส่วน")}</span>
                <span className="text-sm font-semibold text-white">
                  {analysis.score >= 85 
                    ? t("Excellent Proportion!", "สัดส่วนดีเยี่ยม!") 
                    : analysis.score >= 70 
                      ? t("Good framework (Needs adjustment)", "โครงสร้างดี (ควรปรับปรุงเพิ่มเติม)") 
                      : t("Major structural errors", "โครงสร้างมีความผิดพลาดหลัก")}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Metrics Categories */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-[#A0A4AB] uppercase tracking-widest mb-1.5 flex items-center justify-between">
              <span>{t("METRICS & DELTAS", "ตัวบ่งชี้และผลต่างสัดส่วน")}</span>
              <span className="text-[#6A6E77] text-[9px]">{t("Click to analyze detail", "คลิกเพื่อดูการวิเคราะห์อย่างละเอียด")}</span>
            </h3>

            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
              {[
                { 
                  key: "headShape", 
                  label: t("Head Shape (W:H Ratio)", "รูปทรงศีรษะ (กว้าง:สูง)"), 
                  icon: "👤",
                  details: t("Compares head height vs cheek/jaw width to avoid squished/stretched skulls.", "เปรียบเทียบความสูงของศีรษะกับความกว้างของแก้ม/กรามเพื่อหลีกเลี่ยงศีรษะเบี้ยวหรือยืดเกินไป")
                },
                { 
                  key: "headToEyeDistance", 
                  label: t("Eye to Top of Head", "ดวงตาถึงส่วนบนของศีรษะ"), 
                  icon: "👁️",
                  details: t("Verifies vertical placement of the eyes relative to the top of the head (head height).", "ตรวจสอบตำแหน่งแนวตั้งของดวงตาเทียบกับส่วนบนสุดของศีรษะ (ความสูงของศีรษะ)")
                },
                { 
                  key: "headToNoseDistance", 
                  label: t("Nose to Top of Head", "จมูกถึงส่วนบนของศีรษะ"), 
                  icon: "👃",
                  details: t("Verifies vertical placement of the nose relative to the top of the head (head height).", "ตรวจสอบตำแหน่งแนวตั้งของจมูกเทียบกับส่วนบนสุดของศีรษะ (ความสูงของศีรษะ)")
                },
                { 
                  key: "eyeToNoseDistance", 
                  label: t("Nose to Eye Spacing", "ระยะดวงตาถึงจมูก"), 
                  icon: "📐",
                  details: t("Checks vertical height between eye midpoint and nose bottom relative to head height.", "ตรวจสอบระยะห่างแนวตั้งระหว่างแนวกลางดวงตากับส่วนล่างของจมูกสัมพันธ์กับความสูงของศีรษะ")
                },
                { 
                  key: "eyeCenterWidth", 
                  label: t("Interpupillary Spacing", "ระยะห่างระหว่างตา"), 
                  icon: "👀",
                  details: t("Ensures the spacing between the pupils fits skull size proportions correctly.", "ตรวจสอบระยะห่างของรูม่านตาให้สอดคล้องกับขนาดและสัดส่วนของกะโหลกอย่างเหมาะสม")
                },
                { 
                  key: "noseWidth", 
                  label: t("Nose Alar Base", "ฐานปีกจมูก"), 
                  icon: "👃",
                  details: t("Controls nasal flared wings proportion relative to total jaw and head width.", "ตรวจสอบการบานของปีกจมูกเปรียบเทียบกับความกว้างรวมของกรามและศีรษะ")
                },
                { 
                  key: "mouthWidth", 
                  label: t("Cheilion Width (Mouth)", "ความกว้างของริมฝีปาก"), 
                  icon: "👄",
                  details: t("Checks outer limits of mouth/corners relative to pupillary distances.", "ตรวจสอบสัดส่วนความกว้างของมุมปากเทียบกับระยะห่างของตา")
                },
                { 
                  key: "eyeToSideDistance", 
                  label: t("Eye to Head Shape (Side)", "ระยะดวงตาถึงกรอบศีรษะ (ด้านข้าง)"), 
                  icon: "👁️",
                  details: t("Measures spacing from eye centers to left/right head silhouette boundaries.", "วัดระยะห่างจากกึ่งกลางดวงตาถึงขอบเขตศีรษะด้านนอกฝั่งซ้ายและขวา")
                },
                { 
                  key: "noseToSideDistance", 
                  label: t("Nose to Head Shape (Side)", "ระยะจมูกถึงกรอบศีรษะ (ด้านข้าง)"), 
                  icon: "👃",
                  details: t("Measures lateral alignment and distance from nostril flares to outer head boundaries.", "วัดระยะห่างแนวระดับจากปีกจมูกถึงขอบเขตศีรษะภายนอกฝั่งซ้ายและขวา")
                },
                { 
                  key: "mouthToSideDistance", 
                  label: t("Mouth to Head Shape (Side)", "ระยะปากถึงกรอบศีรษะ (ด้านข้าง)"), 
                  icon: "👄",
                  details: t("Measures horizontal spacing from outer lip corners to head silhouette margins.", "วัดระยะห่างแนวระดับจากมุมปากถึงกรอบด้านนอกศีรษะฝั่งซ้ายและขวา")
                }
              ].map((item) => {
                const metric = analysis.categories[item.key as keyof typeof analysis.categories];
                if (!metric) return null;
                const isSelected = selectedCategoryKey === item.key;
                
                // Determine color of bar based on score
                const barColorClass = metric.score >= 85 
                  ? "bg-green-500" 
                  : metric.score >= 70 
                    ? "bg-amber-400" 
                    : "bg-red-500";
                
                const textColorClass = metric.score >= 85 
                  ? "text-green-400" 
                  : metric.score >= 70 
                    ? "text-amber-400" 
                    : "text-red-400";

                return (
                  <button
                    key={item.key}
                    onClick={() => setSelectedCategoryKey(item.key)}
                    onMouseDown={() => setHeldCategoryKey(item.key)}
                    onMouseUp={() => setHeldCategoryKey(null)}
                    onMouseLeave={() => setHeldCategoryKey(null)}
                    onTouchStart={() => setHeldCategoryKey(item.key)}
                    onTouchEnd={() => setHeldCategoryKey(null)}
                    className={`group w-full text-left p-2.5 rounded-lg border transition-all flex flex-col space-y-1.5 relative overflow-hidden ${
                      isSelected 
                        ? "bg-[#252A33] border-[#3B82F6] shadow-md shadow-[#3B82F6]/5" 
                        : "bg-[#1E2229]/60 border-[#2D3139] hover:bg-[#1E2229] hover:border-[#4A505A]"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-sm">{item.icon}</span>
                        <span className="text-xs font-semibold text-white">{item.label}</span>
                      </div>
                      <span className={`text-xs font-mono font-bold ${textColorClass}`}>{metric.score}%</span>
                    </div>

                    {/* Mini comparison block */}
                    <div className="flex items-center justify-between text-[10px] text-[#A0A4AB]">
                      <span>{t("Ref: ", "ต้นแบบ: ")}<strong className="text-white">{metric.portraitRatio}</strong></span>
                      <span>{t("Sculpt: ", "รูปปั้น: ")}<strong className="text-[#3B82F6]">{metric.sculptureRatio}</strong></span>
                      <span className="text-[#6A6E77]">{metric.unit}</span>
                    </div>

                    <div className="h-1.5 w-full bg-[#0F1115] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColorClass}`} style={{ width: `${metric.score}%` }}></div>
                    </div>

                    {/* Premium Hover Tooltip Overlay */}
                    <div className="absolute inset-0 bg-[#1A1D24] p-2.5 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none border border-[#3B82F6]/30 rounded-lg">
                      <span className="text-[9px] font-bold text-[#3B82F6] uppercase tracking-wider mb-0.5">{t("Click & Hold to Highlight", "คลิกค้างไว้เพื่อดูเส้นไฮไลต์")}</span>
                      <p className="text-[10px] text-white leading-normal">{item.details}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Category Details Explanation Panel */}
          {selectedCategoryKey && (
            <div className="bg-[#1E2229] border border-[#3B82F6]/30 p-3.5 rounded-xl space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#3B82F6] uppercase tracking-wide">
                <span>{t("ANALYSIS SPECIFICATION", "รายละเอียดการวิเคราะห์")}</span>
              </div>
              <p className="text-xs font-semibold text-white">
                {selectedCategoryKey === 'headShape' ? t("Skull Width-to-Height Ratio", "อัตราส่วนความกว้างต่อความสูงกะโหลก") : 
                 selectedCategoryKey === 'headToEyeDistance' ? t("Top of Head to Eye Center", "ส่วนบนสุดของศีรษะถึงกึ่งกลางตา") :
                 selectedCategoryKey === 'headToNoseDistance' ? t("Top of Head to Nose", "ส่วนบนสุดของศีรษะถึงจมูก") :
                 selectedCategoryKey === 'eyeToNoseDistance' ? t("Nose to Eye Spacing", "ระยะระหว่างจมูกกับดวงตา") :
                 selectedCategoryKey === 'eyeCenterWidth' ? t("Interpupillary vs Head Ratio", "อัตราส่วนระหว่างดวงตากับขนาดศีรษะ") :
                 selectedCategoryKey === 'noseWidth' ? t("Nostril Alar Width", "ความกว้างของปีกจมูก") : 
                 selectedCategoryKey === 'mouthWidth' ? t("Oral Lip Width", "ความกว้างของริมฝีปาก") :
                 selectedCategoryKey === 'eyeToSideDistance' ? t("Eye to Head Silhouette Spacing", "ระยะห่างดวงตากับขอบศีรษะ") :
                 selectedCategoryKey === 'noseToSideDistance' ? t("Nose to Head Silhouette Spacing", "ระยะห่างจมูกกับขอบศีรษะ") :
                 t("Mouth to Head Silhouette Spacing", "ระยะห่างปากกับขอบศีรษะ")}
              </p>
              {/* Tooltip description built dynamically */}
              <p className="text-[11px] text-[#3B82F6] leading-relaxed italic">
                {selectedCategoryKey === 'headShape' ? t("Compares head height vs cheek/jaw width to avoid squished/stretched skulls.", "เปรียบเทียบความสูงของศีรษะกับความกว้างของแก้ม/กรามเพื่อหลีกเลี่ยงกะโหลกที่เบี้ยวหรือบีบเกินไป") :
                 selectedCategoryKey === 'headToEyeDistance' ? t("Verifies vertical placement of the eyes relative to the top of the head (head height).", "ตรวจสอบตำแหน่งแนวตั้งของดวงตาเทียบกับส่วนบนสุดของศีรษะ (ความสูงของศีรษะ)") :
                 selectedCategoryKey === 'headToNoseDistance' ? t("Verifies vertical placement of the nose relative to the top of the head (head height).", "ตรวจสอบตำแหน่งแนวตั้งของจมูกเทียบกับส่วนบนสุดของศีรษะ (ความสูงของศีรษะ)") :
                 selectedCategoryKey === 'eyeToNoseDistance' ? t("Checks vertical height between eye midpoint and nose bottom relative to head height.", "ตรวจสอบระยะห่างแนวตั้งระหว่างแนวกลางดวงตากับส่วนล่างของจมูกสัมพันธ์กับความสูงของศีรษะ") :
                 selectedCategoryKey === 'eyeCenterWidth' ? t("Ensures the spacing between the pupils fits skull size proportions correctly.", "ตรวจสอบระยะห่างระหว่างรูม่านตาให้สอดคล้องกับขนาดและสัดส่วนของกะโหลกศีรษะอย่างถูกต้อง") :
                 selectedCategoryKey === 'noseWidth' ? t("Controls nasal flared wings proportion relative to total jaw and head width.", "ควบคุมสัดส่วนการบานออกของปีกจมูกเมื่อเทียบกับความกว้างรวมของกรามและศีรษะ") :
                 selectedCategoryKey === 'mouthWidth' ? t("Checks outer limits of mouth/corners relative to pupillary distances.", "ตรวจสอบตำแหน่งมุมปากสัมพันธ์กับระยะห่างระหว่างตาทั้งสองข้าง") :
                 selectedCategoryKey === 'eyeToSideDistance' ? t("Measures spacing from eye centers to left/right head silhouette boundaries.", "วัดระยะห่างจากกึ่งกลางดวงตาถึงขอบเขตศีรษะด้านนอกฝั่งซ้ายและขวา") :
                 selectedCategoryKey === 'noseToSideDistance' ? t("Measures lateral alignment and distance from nostril flares to outer head boundaries.", "วัดระยะห่างแนวระดับจากปีกจมูกถึงขอบเขตศีรษะภายนอกฝั่งซ้ายและขวา") :
                 t("Measures horizontal spacing from outer lip corners to head silhouette margins.", "วัดระยะห่างแนวระดับจากมุมปากถึงกรอบด้านนอกศีรษะฝั่งซ้ายและขวา")}
              </p>
              <p className="text-xs text-[#A0A4AB] leading-relaxed pt-1.5 border-t border-[#2D3139]/60">
                {analysis.categories[selectedCategoryKey as keyof typeof analysis.categories]?.feedback}
              </p>
            </div>
          )}

        </aside>
      </div>

      {/* Footer / Status bar */}
      <footer className="h-8 bg-[#0F1115] border-t border-[#2D3139] px-4 flex items-center justify-between text-[10px] font-mono text-[#6A6E77] shrink-0">
        <div className="flex items-center space-x-4">
          <span className="uppercase text-[#3B82F6]">● {t("System Active", "ระบบกำลังทำงาน")}</span>
          {hoverCoords ? (
            <span>{t("CURSOR PROJECTION", "พิกัดเคอร์เซอร์")}: X:{hoverCoords.x} Y:{hoverCoords.y}</span>
          ) : (
            <span>{t("CURSOR OFF CANVAS", "เคอร์เซอร์อยู่นอกพื้นที่")}</span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="hidden sm:inline">{t("COORDINATES CALIBRATED IN 0-1000px VIRTUAL MATRIX", "ปรับเทียบพิกัดในเมทริกซ์จำลอง 0-1000px")}</span>
          
          {/* Language Selector Toggle */}
          <div className="flex items-center space-x-1.5 border-l border-[#2D3139] pl-4">
            <span className="text-[#6A6E77] uppercase text-[9px]">{t("LANGUAGE", "ภาษา")}:</span>
            <div className="flex bg-[#16181D] rounded border border-[#2D3139] overflow-hidden p-0.5">
              <button 
                onClick={() => changeLanguage('en')}
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all cursor-pointer ${language === 'en' ? 'bg-[#3B82F6] text-white' : 'text-[#A0A4AB] hover:text-white'}`}
              >
                EN
              </button>
              <button 
                onClick={() => changeLanguage('th')}
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all cursor-pointer ${language === 'th' ? 'bg-[#3B82F6] text-white' : 'text-[#A0A4AB] hover:text-white'}`}
              >
                THAI
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper to determine if a specific landmark belongs/influences a selected metric category comparison
function isLandmarkRelatedToCategory(landmarkKey: string, categoryKey: string): boolean {
  if (categoryKey === "headShape") {
    return ["headLeft", "headRight", "foreheadTop", "chin"].includes(landmarkKey);
  }
  if (categoryKey === "eyeToNoseDistance") {
    return ["leftEyeCenter", "rightEyeCenter", "noseLeft", "noseRight", "foreheadTop", "chin"].includes(landmarkKey);
  }
  if (categoryKey === "headToEyeDistance") {
    return ["foreheadTop", "leftEyeCenter", "rightEyeCenter", "chin"].includes(landmarkKey);
  }
  if (categoryKey === "headToNoseDistance") {
    return ["foreheadTop", "noseLeft", "noseRight", "chin"].includes(landmarkKey);
  }
  if (categoryKey === "eyeCenterWidth") {
    return ["leftEyeCenter", "rightEyeCenter", "headLeft", "headRight"].includes(landmarkKey);
  }
  if (categoryKey === "noseWidth") {
    return ["noseLeft", "noseRight", "headLeft", "headRight"].includes(landmarkKey);
  }
  if (categoryKey === "mouthWidth") {
    return ["mouthLeft", "mouthRight", "headLeft", "headRight"].includes(landmarkKey);
  }
  if (categoryKey === "eyeToSideDistance") {
    return ["leftEyeCenter", "rightEyeCenter", "headLeft", "headRight"].includes(landmarkKey);
  }
  if (categoryKey === "noseToSideDistance") {
    return ["noseLeft", "noseRight", "headLeft", "headRight"].includes(landmarkKey);
  }
  if (categoryKey === "mouthToSideDistance") {
    return ["mouthLeft", "mouthRight", "headLeft", "headRight"].includes(landmarkKey);
  }
  return false;
}
