#!/usr/bin/env node

/**
 * 브라우저용 간단한 빌드 스크립트
 * TypeScript를 ES 모듈로 변환하여 브라우저에서 직접 사용 가능하게 함
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = 'dist/browser';
const SRC_DIR = 'src';

// 출력 디렉토리 생성
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🔨 브라우저용 빌드 시작...');

// TypeScript 컴파일
try {
  execSync('npx tsc --outDir dist/browser --module es2020 --target es2020 --moduleResolution node',
    { stdio: 'inherit' });
  console.log('✅ TypeScript 컴파일 완료');
} catch (error) {
  console.error('❌ TypeScript 컴파일 실패:', error.message);
  process.exit(1);
}

// package.json에서 dependencies 정보 읽기
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const dependencies = Object.keys(packageJson.dependencies || {});

// 간단한 import map 생성
const importMap = {
  imports: {}
};

dependencies.forEach(dep => {
  if (dep === '@tensorflow/tfjs') {
    importMap.imports[dep] = 'https://cdn.skypack.dev/@tensorflow/tfjs';
  } else {
    importMap.imports[dep] = `https://cdn.skypack.dev/${dep}`;
  }
});

// ES 모듈 import 경로에 .js 확장자 추가
function addJsExtensions(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      addJsExtensions(filePath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');

      // 상대 경로 import에 .js 확장자 추가
      content = content.replace(
        /from\s+['"`](\.[^'"`]*?)['"`]/g,
        (match, path) => {
          if (!path.endsWith('.js') && !path.includes('?') && !path.includes('#')) {
            return match.replace(path, path + '.js');
          }
          return match;
        }
      );

      fs.writeFileSync(filePath, content);
    }
  }
}

console.log('🔧 ES 모듈 경로 수정 중...');
addJsExtensions(OUTPUT_DIR);

// import map 파일 생성
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'import-map.json'),
  JSON.stringify(importMap, null, 2)
);

console.log('📦 Import map 생성 완료');
console.log('✅ ES 모듈 경로 수정 완료');
console.log('🎉 브라우저용 빌드 완료! dist/browser/ 폴더를 확인하세요.');
