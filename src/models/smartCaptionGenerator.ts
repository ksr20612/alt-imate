import type { AltTextResult, ClassificationResult } from '../types';

/**
 * 똑똑한 이미지 캡션 생성기
 * MobileNet 분류 결과를 조합하여 자연스러운 한국어 문장 생성
 */
export class SmartCaptionGenerator {
  // 객체 카테고리 분류
  private static readonly OBJECT_CATEGORIES = {
    animals: [
      'golden_retriever',
      'Labrador_retriever',
      'beagle',
      'German_shepherd',
      'border_collie',
      'pug',
      'chihuahua',
      'tabby',
      'Persian_cat',
      'Siamese_cat',
      'tiger',
      'lion',
      'elephant',
      'giraffe',
      'zebra',
      'panda',
    ],
    food: [
      'banana',
      'apple',
      'orange',
      'strawberry',
      'pizza',
      'hamburger',
      'hot_dog',
      'coffee_mug',
      'wine_bottle',
      'sandwich',
      'ice_cream',
    ],
    vehicles: [
      'sports_car',
      'convertible',
      'limousine',
      'motorcycle',
      'bicycle',
      'school_bus',
      'truck',
      'airplane',
      'ship',
    ],
    electronics: [
      'laptop',
      'desktop_computer',
      'cellular_telephone',
      'television',
      'radio',
      'computer_keyboard',
      'computer_mouse',
    ],
    furniture: ['chair', 'table', 'bed', 'sofa', 'bookshelf', 'lamp', 'clock'],
    clothing: ['suit', 'dress', 'jeans', 'T-shirt', 'sneakers', 'hat'],
    sports: [
      'tennis_ball',
      'basketball',
      'soccer_ball',
      'guitar',
      'piano',
      'violin',
    ],
  };

  // 한국어 번역 사전
  private static readonly KOREAN_TRANSLATIONS = {
    // 동물
    golden_retriever: '골든 리트리버',
    Labrador_retriever: '래브라도 리트리버',
    beagle: '비글',
    German_shepherd: '저먼 셰퍼드',
    border_collie: '보더 콜리',
    pug: '퍼그',
    chihuahua: '치와와',
    tabby: '얼룩무늬 고양이',
    Persian_cat: '페르시안 고양이',
    Siamese_cat: '샴 고양이',
    tiger: '호랑이',
    lion: '사자',
    elephant: '코끼리',
    giraffe: '기린',
    zebra: '얼룩말',
    panda: '판다',

    // 음식
    banana: '바나나',
    apple: '사과',
    orange: '오렌지',
    strawberry: '딸기',
    pizza: '피자',
    hamburger: '햄버거',
    hot_dog: '핫도그',
    coffee_mug: '커피잔',
    wine_bottle: '와인병',
    sandwich: '샌드위치',
    ice_cream: '아이스크림',

    // 전자기기
    laptop: '노트북',
    desktop_computer: '데스크톱 컴퓨터',
    cellular_telephone: '스마트폰',
    television: '텔레비전',
    radio: '라디오',
    computer_keyboard: '키보드',
    computer_mouse: '마우스',

    // 차량
    sports_car: '스포츠카',
    convertible: '컨버터블',
    motorcycle: '오토바이',
    bicycle: '자전거',
    school_bus: '스쿨버스',

    // 가구
    chair: '의자',
    table: '테이블',
    bed: '침대',
    sofa: '소파',
    lamp: '램프',

    // 의류
    suit: '정장',
    dress: '드레스',
    jeans: '청바지',
    sneakers: '운동화',
    hat: '모자',
  };

  // 상황별 문맥 템플릿
  private static readonly CONTEXT_TEMPLATES = {
    single_object: {
      high_confidence: (obj: string) => `사진에 ${obj}가 보입니다`,
      medium_confidence: (obj: string) => `${obj}로 보이는 객체가 있습니다`,
      low_confidence: (obj: string) => `${obj}와 비슷한 것이 보입니다`,
    },
    multiple_objects: {
      same_category: (objs: string[], category: string) =>
        `${this.getCategoryDescription(category)} 여러 개가 보입니다: ${objs.join(', ')}`,
      different_categories: (primary: string, others: string[]) =>
        `주로 ${primary}가 보이며, ${others.join(', ')}도 함께 있습니다`,
    },
    scene_description: {
      food_scene: (items: string[]) =>
        `맛있어 보이는 ${items.join(', ')}가 포함된 음식 사진입니다`,
      animal_scene: (animal: string, confidence: number) =>
        confidence > 0.8
          ? `귀여운 ${animal}의 모습입니다`
          : `${animal}로 보이는 동물이 있습니다`,
      tech_scene: (device: string) => `${device}가 있는 일상적인 모습입니다`,
      outdoor_scene: (objects: string[]) =>
        `야외에서 촬영된 것으로 보이며 ${objects.join(', ')}가 보입니다`,
    },
  };

  /**
   * 똑똑한 캡션 생성 메인 함수
   */
  static generateSmartCaption(
    classifications: ClassificationResult[]
  ): AltTextResult {
    if (!classifications.length) {
      return {
        altText: '분석할 수 없는 이미지입니다',
        classifications: [],
        confidence: 0,
      };
    }

    // 1. 결과 분석 및 카테고리화
    const analysis = this.analyzeClassifications(classifications);

    // 2. 문맥에 맞는 자연스러운 문장 생성
    const caption = this.generateContextualCaption(analysis);

    // 3. 최종 결과 반환
    return {
      altText: caption,
      classifications,
      confidence: classifications[0].confidence,
    };
  }

  /**
   * 분류 결과 분석 및 카테고리화
   */
  private static analyzeClassifications(
    classifications: ClassificationResult[]
  ) {
    const topResults = classifications.slice(0, 3); // 상위 3개만 분석
    const categorized = new Map<string, ClassificationResult[]>();
    const translated = new Map<string, string>();

    // 카테고리별로 분류
    for (const result of topResults) {
      const category = this.getObjectCategory(result.className);
      const koreanName = this.getKoreanName(result.className);

      if (!categorized.has(category)) {
        categorized.set(category, []);
      }
      categorized.get(category)!.push(result);
      translated.set(result.className, koreanName);
    }

    return {
      topResult: topResults[0],
      categorized,
      translated,
      hasMultipleCategories: categorized.size > 1,
      dominantCategory: this.getDominantCategory(categorized),
    };
  }

  /**
   * 문맥에 맞는 자연스러운 캡션 생성
   */
  private static generateContextualCaption(analysis: any): string {
    const {
      topResult,
      categorized,
      translated,
      hasMultipleCategories,
      dominantCategory,
    } = analysis;

    const mainObject =
      translated.get(topResult.className) || topResult.className;
    const confidence = topResult.confidence;

    // 단일 객체 vs 복수 객체
    if (
      categorized.size === 1 &&
      categorized.get(dominantCategory)!.length === 1
    ) {
      return this.generateSingleObjectCaption(
        mainObject,
        confidence,
        dominantCategory
      );
    }

    // 같은 카테고리 여러 객체
    if (!hasMultipleCategories) {
      const categoryResults = categorized.get(dominantCategory)!;
      const objects: string[] = [];

      for (const result of categoryResults.slice(0, 2)) {
        const koreanName = translated.get(result.className);
        if (koreanName) objects.push(koreanName);
      }

      return this.generateSameCategoryCaption(objects, dominantCategory);
    }

    // 다양한 카테고리 객체들
    const otherObjects: string[] = [];
    for (const results of categorized.values()) {
      for (const result of results.slice(1, 3)) {
        const koreanName = translated.get(result.className);
        if (koreanName) otherObjects.push(koreanName);
      }
    }

    return this.generateMixedCategoryCaption(mainObject, otherObjects);
  }

  /**
   * 단일 객체 캡션 생성
   */
  private static generateSingleObjectCaption(
    object: string,
    confidence: number,
    category: string
  ): string {
    // 카테고리별 특별 처리
    if (category === 'animals') {
      if (confidence > 0.8) return `귀여운 ${object}의 사진입니다`;
      if (confidence > 0.5) return `${object}로 보이는 동물이 있습니다`;
      return `${object}와 비슷한 동물이 보입니다`;
    }

    if (category === 'food') {
      if (confidence > 0.8) return `맛있어 보이는 ${object}입니다`;
      return `${object}로 보이는 음식이 있습니다`;
    }

    if (category === 'electronics') {
      return `${object}가 있는 모습입니다`;
    }

    // 기본 템플릿
    if (confidence > 0.7) return `사진에 ${object}가 보입니다`;
    if (confidence > 0.4) return `${object}로 보이는 객체가 있습니다`;
    return `${object}와 비슷한 것이 보입니다`;
  }

  /**
   * 같은 카테고리 여러 객체 캡션
   */
  private static generateSameCategoryCaption(
    objects: string[],
    category: string
  ): string {
    const categoryDesc = this.getCategoryDescription(category);

    if (objects.length === 1) {
      return `${categoryDesc} 사진입니다. ${objects[0]}가 보입니다`;
    }

    return `${categoryDesc} 관련 사진입니다. ${objects.join('와 ')}가 보입니다`;
  }

  /**
   * 다양한 카테고리 객체 캡션
   */
  private static generateMixedCategoryCaption(
    mainObject: string,
    otherObjects: string[]
  ): string {
    if (otherObjects.length === 0) {
      return `주로 ${mainObject}가 보이는 사진입니다`;
    }

    if (otherObjects.length === 1) {
      return `${mainObject}와 ${otherObjects[0]}가 함께 있는 사진입니다`;
    }

    return `${mainObject}를 포함해 여러 객체들이 있는 복합적인 사진입니다`;
  }

  /**
   * 객체의 카테고리 찾기
   */
  private static getObjectCategory(className: string): string {
    for (const [category, objects] of Object.entries(this.OBJECT_CATEGORIES)) {
      if (objects.includes(className)) {
        return category;
      }
    }
    return 'unknown';
  }

  /**
   * 한국어 이름 가져오기
   */
  private static getKoreanName(className: string): string {
    return (
      this.KOREAN_TRANSLATIONS[
        className as keyof typeof this.KOREAN_TRANSLATIONS
      ] || className.replace(/_/g, ' ')
    );
  }

  /**
   * 지배적인 카테고리 찾기
   */
  private static getDominantCategory(
    categorized: Map<string, ClassificationResult[]>
  ): string {
    let maxConfidence = 0;
    let dominantCategory = 'unknown';

    for (const [category, results] of categorized) {
      const avgConfidence =
        results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
      if (avgConfidence > maxConfidence) {
        maxConfidence = avgConfidence;
        dominantCategory = category;
      }
    }

    return dominantCategory;
  }

  /**
   * 카테고리 설명 가져오기
   */
  private static getCategoryDescription(category: string): string {
    const descriptions = {
      animals: '동물',
      food: '음식',
      vehicles: '차량',
      electronics: '전자기기',
      furniture: '가구',
      clothing: '의류',
      sports: '스포츠 용품',
    };
    return descriptions[category as keyof typeof descriptions] || '객체';
  }
}
