import * as tf from '@tensorflow/tfjs';
import type { ClassificationResult, ModelLoadOptions } from '../types';

/**
 * TensorFlow.js를 이용한 이미지 분류기
 * MobileNet 모델을 사용하여 ImageNet 1000개 클래스 분류
 */
export class ImageClassifier {
  private model: tf.LayersModel | null = null;
  private isLoading = false;
  private classNames: string[] = [];

  // MobileNet v2 모델 URL (TensorFlow Hub)
  private static readonly DEFAULT_MODEL_URL =
    'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3/default/1';

  /**
   * 모델 로드 (싱글톤 패턴)
   */
  async loadModel(options: ModelLoadOptions = {}): Promise<void> {
    if (this.model) {
      return; // 이미 로드됨
    }

    if (this.isLoading) {
      // 로딩 중이면 완료까지 대기
      await this.waitForLoading();
      return;
    }

    this.isLoading = true;

    try {
      const { modelUrl = ImageClassifier.DEFAULT_MODEL_URL, onLoadProgress } =
        options;

      console.log('🤖 TensorFlow.js 모델 로딩 시작...');

      // 진행률 콜백 설정
      if (onLoadProgress) {
        // 모델 로딩은 단계별로 진행되므로 간단한 진행률 시뮬레이션
        setTimeout(() => onLoadProgress(0.3), 100);
        setTimeout(() => onLoadProgress(0.7), 500);
      }

      // 모델 로드
      this.model = await tf.loadLayersModel(modelUrl);

      // ImageNet 클래스명 로드
      await this.loadImageNetLabels();

      if (onLoadProgress) {
        onLoadProgress(1.0);
      }

      console.log('✅ 모델 로딩 완료!');
      console.log(
        `📊 모델 정보: ${this.model.layers.length}개 레이어, ${this.classNames.length}개 클래스`
      );
    } catch (error) {
      console.error('❌ 모델 로딩 실패:', error);
      throw new Error(
        `모델 로딩에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 이미지 분류 수행
   * @param imageTensor - 전처리된 이미지 텐서 [1, 224, 224, 3]
   * @param maxPredictions - 반환할 최대 예측 결과 수
   */
  async classify(
    imageTensor: tf.Tensor,
    maxPredictions = 5
  ): Promise<ClassificationResult[]> {
    if (!this.model) {
      throw new Error(
        '모델이 로드되지 않았습니다. loadModel()을 먼저 호출하세요.'
      );
    }

    try {
      // 모델 예측 실행
      const predictions = this.model.predict(imageTensor) as tf.Tensor;

      // 확률값 추출
      const probabilities = await predictions.data();

      // 상위 N개 결과 추출
      const results: ClassificationResult[] = [];
      const indices = Array.from(probabilities)
        .map((prob, index) => ({ probability: prob, index }))
        .sort((a, b) => b.probability - a.probability)
        .slice(0, maxPredictions);

      for (const { probability, index } of indices) {
        results.push({
          className: this.classNames[index] || `Unknown_${index}`,
          probability: probability,
          confidence: probability, // 동일한 값이지만 더 직관적인 필드명
        });
      }

      // 메모리 정리
      predictions.dispose();

      console.log('🎯 분류 결과:', results.slice(0, 3)); // 상위 3개만 로그
      return results;
    } catch (error) {
      console.error('❌ 이미지 분류 실패:', error);
      throw new Error(
        `이미지 분류에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  }

  /**
   * ImageNet 클래스명 로드
   * 1000개의 클래스 라벨을 로드합니다.
   */
  private async loadImageNetLabels(): Promise<void> {
    try {
      // ImageNet 클래스명 URL
      const labelsUrl =
        'https://storage.googleapis.com/download.tensorflow.org/data/ImageNetLabels.txt';

      const response = await fetch(labelsUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const labelsText = await response.text();
      this.classNames = labelsText.trim().split('\n');

      console.log(`📝 ImageNet 라벨 로드 완료: ${this.classNames.length}개`);
    } catch (error) {
      console.warn('⚠️ ImageNet 라벨 로드 실패, 기본 라벨 사용:', error);

      // 기본 라벨 (일부만)
      this.classNames = Array.from({ length: 1000 }, (_, i) => `class_${i}`);
    }
  }

  /**
   * 모델 로딩 완료까지 대기
   */
  private async waitForLoading(): Promise<void> {
    while (this.isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * 모델이 로드되었는지 확인
   */
  isModelLoaded(): boolean {
    return this.model !== null;
  }

  /**
   * 모델 메모리 해제
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      console.log('🗑️ 모델 메모리 해제 완료');
    }
  }

  /**
   * 모델 정보 반환
   */
  getModelInfo(): { totalClasses: number; isLoaded: boolean } {
    return {
      totalClasses: this.classNames.length,
      isLoaded: this.isModelLoaded(),
    };
  }
}
