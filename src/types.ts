export interface Point {
  x: number; // 0 to 1000 normalized coordinate
  y: number; // 0 to 1000 normalized coordinate
}

export interface Landmarks {
  foreheadTop: Point;
  chin: Point;
  leftEyeCenter: Point;
  rightEyeCenter: Point;
  noseLeft: Point;
  noseRight: Point;
  mouthLeft: Point;
  mouthRight: Point;
  headLeft: Point;
  headRight: Point;
  noseBridge?: Point; // optional nasal bridge
  jawLeft?: Point;
  jawRight?: Point;
}

export interface RatioDetails {
  score: number;
  feedback: string;
  portraitRatio: number;
  sculptureRatio: number;
  unit: string;
}

export interface ComparisonCategories {
  headShape: RatioDetails;
  headToEyeDistance: RatioDetails;     // Eye to Top of Head vertical relative spacing
  headToNoseDistance: RatioDetails;    // Nose to Top of Head vertical relative spacing
  eyeToNoseDistance: RatioDetails;     // Nose to Eye vertical relative spacing
  eyeCenterWidth: RatioDetails;       // Interpupillary distance vs head width
  noseWidth: RatioDetails;            // Nose width vs head width
  mouthWidth: RatioDetails;           // Mouth width vs head width
  eyeToSideDistance: RatioDetails;    // Lateral margin eye to side silhouette
  noseToSideDistance: RatioDetails;   // Lateral margin nose to side silhouette
  mouthToSideDistance: RatioDetails;  // Lateral margin mouth to side silhouette
}

export interface AnalysisResult {
  score: number; // overall match score (0-100)
  portraitLandmarks: Landmarks;
  sculptureLandmarks: Landmarks;
  categories: ComparisonCategories;
}
