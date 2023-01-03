# reifier

### 실행

```
./reifier.sh {repo} {branch}
```

### 환경 변수

- REIFIER_BUILD: 빌드 스크립트
- REIFIER_PATTERN: 추적할 파일명의 정규식
- REIFIER_NOPUSH: git push 를 생략하고자 할 때


### HTML diff 생성

```
cd renderer
yarn install
node index.js {repo} {before} {after} > index.html
```

before, after 는 브랜치명

Cloudflare Wrangler가 설치되어 있다면, 아래 명령어로 Cloudflare Pages에 배포

```
./publish.sh {repo} {before} {after}
```
