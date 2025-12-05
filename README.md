# Reifier

Git 브랜치 간 빌드 결과물(artifact)을 비교하는 CLI 도구.

PR 리뷰 시 컴파일된 결과물의 변경사항을 시각적으로 확인할 수 있다.

## 설치

```bash
npm install -g reifier
# 또는
npx reifier
```

## Quick Start

```bash
# 두 브랜치의 빌드 결과물 비교
npx reifier run ./my-repo \
  --base main \
  --head feature-branch \
  --include "src/**/*.js" \
  -o diff.html
```

이 명령어는:
1. `main` 브랜치로 전환 → 빌드 → 결과물 캡처
2. `feature-branch`로 전환 → 빌드 → 결과물 캡처
3. 두 결과물의 diff를 HTML로 생성

## Include 패턴 (필수)

`--include` 옵션은 **필수**이며, 캡처할 파일을 glob 패턴으로 지정한다.

### 패턴 작성 가이드

```bash
# ✅ 좋은 예: 구체적인 경로 지정
--include "apps/web/src/**/*.mjs"      # 특정 앱의 src만
--include "src/**/*.js"                 # src 하위의 JS만
--include "dist/**/*.js"                # dist 폴더만

# ❌ 나쁜 예: 너무 넓은 범위
--include "**/*.mjs"                    # node_modules도 포함될 수 있음
--include "*.js"                        # 모든 JS 파일
```

### 여러 패턴 지정

```bash
# 여러 --include 옵션 사용
reifier run . --base main --head feature \
  --include "apps/web/src/**/*.mjs" \
  --include "packages/lib/src/**/*.js"
```

### 설정 파일로 관리

프로젝트 루트에 `.reifierrc` 파일:

```json
{
  "buildCommand": "pnpm build",
  "include": [
    "apps/web/src/**/*.mjs",
    "packages/lib/src/**/*.js"
  ]
}
```

## CLI 명령어

### `run` - 전체 파이프라인

가장 일반적인 사용법. 두 브랜치를 비교하는 전체 과정을 한 번에 실행.

```bash
reifier run <repo> --base <branch> --head <branch> [options]
```

**예시:**
```bash
# 기본 사용
reifier run . --base main --head feature/new-ui --include "src/**/*.js"

# 커스텀 빌드 명령어
reifier run . --base main --head develop \
  --build "npm run build" \
  --include "dist/**/*.js"

# 여러 패턴 지정
reifier run . --base main --head feature \
  --include "apps/web/src/**/*.mjs" \
  --include "packages/lib/src/**/*.js"

# 결과를 파일로 저장
reifier run . --base main --head feature \
  --include "src/**/*.js" \
  -o diff.html

# git push 생략 (로컬 테스트용)
reifier run . --base main --head feature \
  --include "src/**/*.js" \
  --no-push
```

### `capture` - 단일 브랜치 캡처

특정 브랜치의 빌드 결과물만 캡처. 이미 캡처된 브랜치가 있을 때 유용.

```bash
reifier capture <repo> <branch> [options]
```

**예시:**
```bash
reifier capture . main --include "src/**/*.js"
reifier capture . feature-branch \
  --build "yarn build" \
  --include "dist/**/*.js"
```

### `diff` - diff HTML 생성

이미 캡처된 두 브랜치의 결과물로 diff HTML 생성.

```bash
reifier diff <repo> <base> <head> [options]
```

**예시:**
```bash
reifier diff . main feature-branch -o diff.html
```

### `deploy` - diff HTML 배포

생성된 diff HTML을 surge.sh에 배포하여 공유 링크 생성.

```bash
reifier deploy <html-file> [options]
```

**예시:**
```bash
# 랜덤 도메인으로 배포
reifier deploy diff.html

# 커스텀 도메인 지정
reifier deploy diff.html -d my-diff.surge.sh
```

## 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `-b, --build <cmd>` | 빌드 명령어 | `yarn && yarn build` |
| `-i, --include <glob>` | 캡처할 파일 패턴 (glob, 여러번 지정 가능) | **필수** |
| `-o, --output <file>` | 출력 파일 경로 | stdout |
| `--clean` | 빌드 전 이전 결과물 정리 | false |
| `--no-push` | git push 생략 | false |

CLI 옵션이 설정 파일(`.reifierrc`)보다 우선한다.

## 작동 방식

1. **캡처**: 각 브랜치에서 빌드 실행 후, 패턴에 맞는 파일들을 `_artifacts/{branch}/` 디렉토리에 복사
2. **저장**: `reified`라는 orphan 브랜치에 결과물 커밋 (히스토리 추적용)
3. **비교**: 두 브랜치의 `_artifacts` 디렉토리를 `diff`로 비교
4. **렌더링**: [diff2html](https://diff2html.xyz/)로 보기 좋은 HTML 생성

## 사용 예시

### ReScript 프로젝트

```bash
# apps/web/src 하위의 .mjs 파일만 비교
reifier run . --base main --head feature \
  --include "apps/web/src/**/*.mjs"
```

### TypeScript 프로젝트

```bash
reifier run . --base main --head feature \
  --build "npm run build" \
  --include "dist/**/*.js"
```

### Monorepo 프로젝트

```bash
# 여러 패키지의 빌드 결과물 비교
reifier run . --base main --head feature \
  --build "pnpm build" \
  --include "packages/*/dist/**/*.js" \
  --include "apps/*/build/**/*.js"
```

## 라이브러리로 사용

```typescript
import { capture, diff, run } from 'reifier';

// 전체 파이프라인
await run({
  repo: '.',
  base: 'main',
  head: 'feature',
  buildCommand: 'npm run build',
  include: ['src/**/*.js', 'lib/**/*.js'],
  output: 'diff.html',
});

// 개별 명령어
await capture({
  repo: '.',
  branch: 'main',
  buildCommand: 'npm run build',
  include: ['src/**/*.js'],
});

await diff({
  repo: '.',
  base: 'main',
  head: 'feature',
  output: 'diff.html',
});
```

## License

MIT
