import * as tf from '@tensorflow/tfjs';
import type {
  ImageInput,
  ImageProcessingOptions,
  SupportedImageFormat,
} from '../types';

/**
 * 이미지 전처리 유틸리티 클래스
 * 사용자 이미지를 TensorFlow.js 모델이 이해할 수 있는 텐서로 변환
 */
export class ImageProcessor {
  private static readonly DEFAULT_TARGET_SIZE = 224;
  private static readonly SUPPORTED_FORMATS = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  /**
   * 이미지를 텐서로 변환 (메인 함수)
   * @param imageInput - 처리할 이미지 (File, Blob, HTMLImageElement, HTMLCanvasElement)
   * @param options - 처리 옵션
   * @returns 전처리된 텐서
   */
  static async processImage(
    imageInput: ImageInput,
    options: ImageProcessingOptions = {}
  ): Promise<tf.Tensor> {
    const { targetSize = this.DEFAULT_TARGET_SIZE, normalize = true } = options;

    // 1. 이미지 형태에 따라 HTMLImageElement로 변환
    const imageElement = await this.toImageElement(imageInput);

    // 2. 캔버스를 이용해 크기 조정
    const resizedCanvas = this.resizeImage(imageElement, targetSize);

    // 3. 텐서로 변환
    let tensor = tf.browser.fromPixels(resizedCanvas);

    // 4. 정규화 (0-255 → 0-1)
    if (normalize) {
      tensor = tensor.div(255.0);
    }

    // 5. 배치 차원 추가 [height, width, channels] → [1, height, width, channels]
    tensor = tensor.expandDims(0);

    return tensor;
  }

  /**
   * 다양한 이미지 입력을 HTMLImageElement로 변환
   */
  private static async toImageElement(
    imageInput: ImageInput
  ): Promise<HTMLImageElement> {
    if (imageInput instanceof HTMLImageElement) {
      return imageInput;
    }

    if (imageInput instanceof HTMLCanvasElement) {
      return this.canvasToImage(imageInput);
    }

    if (imageInput instanceof File || imageInput instanceof Blob) {
      // 파일 형식 검증
      this.validateImageFormat(imageInput);
      return this.fileToImage(imageInput);
    }

    throw new Error('지원하지 않는 이미지 형식입니다.');
  }

  /**
   * File/Blob을 HTMLImageElement로 변환
   */
  private static async fileToImage(
    file: File | Blob
  ): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url); // 메모리 정리
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('이미지 로딩에 실패했습니다.'));
      };

      img.src = url;
    });
  }

  /**
   * Canvas를 HTMLImageElement로 변환
   */
  private static canvasToImage(
    canvas: HTMLCanvasElement
  ): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('캔버스를 이미지로 변환할 수 없습니다.'));
          return;
        }
        this.fileToImage(blob).then(resolve).catch(reject);
      });
    });
  }

  /**
   * 이미지 크기 조정 (정사각형으로 리사이즈)
   */
  private static resizeImage(
    img: HTMLImageElement,
    targetSize: number
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');
    }

    canvas.width = targetSize;
    canvas.height = targetSize;

    // 이미지를 정사각형으로 크롭하면서 리사이즈
    const size = Math.min(img.width, img.height);
    const x = (img.width - size) / 2;
    const y = (img.height - size) / 2;

    ctx.drawImage(
      img,
      x,
      y,
      size,
      size, // 소스 영역 (정사각형으로 크롭)
      0,
      0,
      targetSize,
      targetSize // 대상 영역
    );

    return canvas;
  }

  /**
   * 이미지 파일 형식 검증
   */
  private static validateImageFormat(file: File | Blob): void {
    if (
      !file.type ||
      !this.SUPPORTED_FORMATS.includes(file.type as SupportedImageFormat)
    ) {
      throw new Error(
        `지원하지 않는 파일 형식입니다. 지원 형식: ${this.SUPPORTED_FORMATS.join(', ')}`
      );
    }
  }

  /**
   * 텐서 메모리 정리 (사용 후 호출 권장)
   */
  static disposeTensor(tensor: tf.Tensor): void {
    tensor.dispose();
  }
}
