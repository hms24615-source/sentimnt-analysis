# 01. 프로젝트 생성 및 기본 구조

## 1. 목적

Antigravity 에이전트가 동일한 기술 선택과 폴더 구조로 감성 분석 서비스을
생성하도록 정의한다.

## 2. 확정 기술 선택

-   Node.js LTS
-   HTML5
-   CSS3
-   Vanilla JavaScript (ES Modules)
-   Node.js 서버리스 함수: Vercel Functions
-   OpenAI 공식 Node.js SDK
-   Supabase JavaScript SDK는 서버에서만 사용
-   테스트: Node 내장 테스트 러너(`node:test`)를 우선 사용

프레임워크(React, Vue, Next.js 등)는 추가하지 않는다. Vercel의 정적
파일과 `/api` 서버리스 함수를 함께 사용한다.

## 3. 권장 디렉터리 구조

``` text
planet/
├─ AGENTS.md
├─ PRD.md
├─ package.json
├─ package-lock.json
├─ .gitignore
├─ .env.example
├─ vercel.json
├─ index.html
├─ assets/
│  ├─ images/
│  │  └─ astronaut-visual.webp
│  └─ icons/
├─ css/
│  ├─ tokens.css
│  ├─ base.css
│  ├─ layout.css
│  └─ components.css
├─ js/
│  ├─ app.js
│  ├─ api.js
│  ├─ ui.js
│  └─ validators.js
├─ api/
│  └─ analyze.js
├─ lib/
│  ├─ openai.js
│  ├─ supabase.js
│  ├─ schemas.js
│  └─ errors.js
├─ supabase/
│  └─ migrations/
│     └─ 001_create_analysis_events.sql
├─ tests/
│  ├─ validators.test.js
│  ├─ api-contract.test.js
│  └─ fixtures/
└─ docs/
   ├─ 01-project-setup.md
   ├─ 02-ui-implementation.md
   ├─ 03-frontend-implementation.md
   ├─ 04-backend-api.md
   ├─ 05-ai-sentiment.md
   └─ 06-database-deployment-testing.md
```

에이전트는 실제 배포 플랫폼의 함수 경로 규칙에 맞게 파일을 배치한다.
Vercel에서 `/api/analyze`가 Node.js 함수로 인식되는지 로컬 및 배포
환경에서 확인한다.

## 4. 초기 생성 순서

1.  빈 프로젝트 디렉터리를 확인한다.
2.  `package.json`을 생성하고 서버 SDK와 테스트 스크립트를 정의한다.
3.  정적 HTML/CSS/JS 구조를 생성한다.
4.  `/api/analyze` 서버리스 함수의 기본 응답을 만든다.
5.  환경 변수 예시와 `.gitignore`를 만든다.
6.  Supabase 마이그레이션을 추가한다.
7.  단위 테스트와 API 계약 테스트를 추가한다.
8.  로컬 실행과 Vercel 빌드/배포 설정을 검증한다.

## 5. 패키지 규칙

필요 최소 패키지만 설치한다. - `openai`: OpenAI API 서버 호출 -
`@supabase/supabase-js`: Supabase 서버 연결 - 테스트는 Node 기본 기능을
우선한다.

개발 편의를 위한 추가 패키지는 목적과 대체 가능성을 검토한 뒤 도입한다.
프론트엔드 번들러나 CSS 프레임워크는 기본적으로 추가하지 않는다.

## 6. 환경 변수 예시

`.env.example`에는 이름과 설명만 기록하고 실제 값을 넣지 않는다.

``` dotenv
OPENAI_API_KEY=
OPENAI_MODEL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

`OPENAI_MODEL`은 배포 시 실제 계정에서 사용 가능한 모델 ID를 지정한다.
모델명을 코드에 임의로 고정하거나 존재 여부를 추측하지 않는다.

## 7. Git 및 비밀값

`.gitignore`에 `.env`, `.env.*`(단 `.env.example` 제외),
`node_modules/`, `.vercel/`, 로그, 임시 파일을 포함한다. 커밋 전에
비밀값이 포함되지 않았는지 확인한다.

## 8. 완료 기준

-   문서에 정의된 폴더가 생성되어 있다.
-   `npm install`이 성공한다.
-   `npm run dev` 또는 Vercel 로컬 개발 명령으로 정적 페이지와 API를
    함께 실행할 수 있다.
-   `.env.example`이 존재하고 실제 `.env`는 Git에서 제외된다.
-   API 경로가 로컬에서 확인된다.
