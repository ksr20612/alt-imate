/**
 * 이미지 분석 결과 타입 정의
 */
export interface ClassificationResult {
  /** 분류된 클래스명 (영어) */
  className: string;
  /** 신뢰도 (0-1) */
  probability: number;
  /** 신뢰도 (0-1) - probability와 동일하지만 더 직관적인 이름 */
  confidence: number;
}

/**
 * 대체어 생성 결과
 */
export interface AltTextResult {
  /** 생성된 한국어 대체어 */
  altText: string;
  /** 원본 분류 결과들 */
  classifications: ClassificationResult[];
  /** 가장 높은 신뢰도 */
  confidence: number;
}

/**
 * 이미지 처리 옵션
 */
export interface ImageProcessingOptions {
  /** 이미지 크기 조정 (기본값: 224) */
  targetSize?: number;
  /** 정규화 여부 (기본값: true) */
  normalize?: boolean;
  /** 최대 예측 결과 개수 (기본값: 5) */
  maxPredictions?: number;
}

/**
 * 모델 로딩 옵션
 */
export interface ModelLoadOptions {
  /** 모델 URL (기본값: TensorFlow Hub MobileNet) */
  modelUrl?: string;
  /** 모델 로딩 완료 콜백 */
  onLoadProgress?: (progress: number) => void;
}

/**
 * 메인 분석 함수의 옵션
 */
export interface AnalyzeImageOptions extends ImageProcessingOptions {
  /** 모델 로딩 옵션 */
  modelOptions?: ModelLoadOptions;
}

/**
 * 에러 타입
 */
export class ImageAnalysisError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ImageAnalysisError';
  }
}

/**
 * 지원되는 이미지 포맷
 */
export type SupportedImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';

/**
 * 이미지 입력 타입
 */
export type ImageInput = HTMLImageElement | HTMLCanvasElement | File | Blob;
