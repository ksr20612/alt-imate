/**
 * Alt-imate: TensorFlow.js를 이용한 이미지 분석 및 대체어 생성 라이브러리
 *
 * 사용법:
 * ```typescript
 * import { analyzeImage } from 'alt-imate';
 *
 * const result = await analyzeImage(file);
 * console.log(result.altText); // "황금색 털을 가진 골든 리트리버"
 * ```
 */

import { ImageClassifier } from './models/imageClassifier';
import { SmartCaptionGenerator } from './models/smartCaptionGenerator';
import { ImageAnalysisError } from './types';
import { ImageProcessor } from './utils/imageProcessor';

import type {
    AltTextResult,
    AnalyzeImageOptions,
    ClassificationResult,
    ImageInput,
    ModelLoadOptions
} from './types';

// 전역 분류기 인스턴스 (싱글톤)
let globalClassifier: ImageClassifier | null = null;

/**
 * 🎯 메인 함수: 이미지를 분석하여 한국어 대체어 생성
 *
 * @param imageInput - 분석할 이미지 (File, Blob, HTMLImageElement, HTMLCanvasElement)
 * @param options - 분석 옵션
 * @returns 대체어 생성 결과
 *
 * @example
 * ```typescript
 * // 기본 사용법
 * const result = await analyzeImage(file);
 * console.log(result.altText); // "황금색 털을 가진 골든 리트리버"
 *
 * // 옵션 사용
 * const result = await analyzeImage(file, {
 *   maxPredictions: 3,
 *   modelOptions: {
 *     onLoadProgress: (progress) => console.log(`${progress * 100}%`)
 *   },

 * });
 * ```
 */
export async function analyzeImage(
  imageInput: ImageInput,
  options: AnalyzeImageOptions = {}
): Promise<AltTextResult> {
  try {
    console.log('🔍 이미지 분석 시작...');

    // 1. 분류기 초기화 (한번만 로드)
    if (!globalClassifier) {
      globalClassifier = new ImageClassifier();
    }

    if (!globalClassifier.isModelLoaded()) {
      console.log('🤖 모델 로딩 중...');
      await globalClassifier.loadModel(options.modelOptions);
    }

    // 2. 이미지 전처리
    console.log('📸 이미지 전처리 중...');
    const tensor = await ImageProcessor.processImage(imageInput, {
      targetSize: options.targetSize,
      normalize: options.normalize,
      maxPredictions: options.maxPredictions,
    });

    // 3. 이미지 분류
    console.log('🧠 이미지 분류 중...');
    const classifications = await globalClassifier.classify(
      tensor,
      options.maxPredictions || 5
    );

    // 4. 똑똑한 캡션 생성
    console.log('✍️ 자연스러운 캡션 생성 중...');
    const result = SmartCaptionGenerator.generateSmartCaption(classifications);

    // 5. 메모리 정리
    ImageProcessor.disposeTensor(tensor);

    console.log('✅ 분석 완료:', result.altText);
    return result;

  } catch (error) {
    console.error('❌ 이미지 분석 실패:', error);

    if (error instanceof ImageAnalysisError) {
      throw error;
    }

    throw new ImageAnalysisError(
      `이미지 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'ANALYSIS_FAILED'
    );
  }
}

/**
 * 🔧 고급 사용자를 위한 개별 분류 함수
 * 대체어 생성 없이 원본 분류 결과만 반환
 */
export async function classifyImage(
  imageInput: ImageInput,
  options: Omit<AnalyzeImageOptions, 'customAltTextMap'> = {}
): Promise<ClassificationResult[]> {
  try {
    if (!globalClassifier) {
      globalClassifier = new ImageClassifier();
    }

    if (!globalClassifier.isModelLoaded()) {
      await globalClassifier.loadModel(options.modelOptions);
    }

    const tensor = await ImageProcessor.processImage(imageInput, options);
    const classifications = await globalClassifier.classify(tensor, options.maxPredictions || 5);

    ImageProcessor.disposeTensor(tensor);
    return classifications;

  } catch (error) {
    throw new ImageAnalysisError(
      `이미지 분류 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'CLASSIFICATION_FAILED'
    );
  }
}

/**
 * 🛠️ 모델 사전 로딩 (선택사항)
 * 앱 시작시 미리 로딩하여 첫 분석 속도 향상
 */
export async function preloadModel(options: ModelLoadOptions = {}): Promise<void> {
  if (!globalClassifier) {
    globalClassifier = new ImageClassifier();
  }

  if (!globalClassifier.isModelLoaded()) {
    await globalClassifier.loadModel(options);
  }
}

/**
 * 📊 모델 상태 확인
 */
export function getModelStatus(): { isLoaded: boolean; totalClasses: number } {
  if (!globalClassifier) {
    return { isLoaded: false, totalClasses: 0 };
  }
  return globalClassifier.getModelInfo();
}

/**
 * 🗑️ 리소스 정리 (앱 종료시 호출 권장)
 */
export function cleanup(): void {
  if (globalClassifier) {
    globalClassifier.dispose();
    globalClassifier = null;
  }
  console.log('🧹 Alt-imate 리소스 정리 완료');
}

// =========================
// 개별 클래스 및 타입 내보내기
// =========================

// 고급 사용자를 위한 개별 클래스들
export { ImageClassifier, ImageProcessor, SmartCaptionGenerator };

// TypeScript 타입들
    export type {
        AltTextResult, AnalyzeImageOptions, ClassificationResult, ImageInput, ImageProcessingOptions,
        ModelLoadOptions,
        SupportedImageFormat
    } from './types';

// 에러 클래스
export { ImageAnalysisError };

// 라이브러리 정보
export const version = '1.0.0';
export const name = 'Alt-imate';
