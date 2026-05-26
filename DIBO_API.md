# Dibo Extension API 문서

디보 익스텐션 콘텐츠(프론트 코드) 개발 시 참고용 API 레퍼런스입니다.

---

## 공통 사항

- `axios`와 인증 토큰은 이미 전역에 설정되어 있으므로 별도 추가 불필요
- `copy_config_id`는 그대로 유지 — 디보 백오피스에서 코드 복사 시 실제 `config_id`로 자동 치환되어 클립보드에 복사됨
- **데이터 우선순위**: API 패치 성공 시 API 데이터 사용, 실패하거나 패치하지 않을 경우 로컬 샘플 데이터(변수) 사용

### 상단 주석 작성 규칙

모든 익스텐션 파일은 `<!DOCTYPE html>` 바로 아래에 아래 형식의 주석 블록을 작성합니다.
해당 익스텐션이 무엇인지, 어떻게 설정하는지를 한눈에 파악할 수 있도록 작성합니다.

```html
<!--
  ================================================================
  ✦ 디보(dibo) 익스텐션 | [익스텐션 이름] – [대상 업종/용도]
  ================================================================

  【페이지 개요】
  이 익스텐션이 어떤 UI이고, 어떤 환경(모바일/PC)에서 어떻게 동작하며,
  어떤 목적(전환율, 이탈 방지 등)에 최적화되어 있는지 2~4줄로 설명합니다.
  적합한 업종이나 사용 시나리오가 있다면 함께 명시합니다.

  【SEO 키워드】
  이 익스텐션을 검색할 때 사용할 핵심 키워드를 쉼표로 나열합니다.
  (예: 피부과 무료 상담 신청, 우측 고정 CTA 폼, 이탈 방지 상담폼)

  【사용 전 필수 설정】
  1. [설정 항목명]
     → 구체적인 수정 위치 및 방법 안내

  2. [설정 항목명]
     → 구체적인 수정 위치 및 방법 안내

  (필요에 따라 항목 추가. API 연동 항목은 ★ [수정 필수] 표시)

  【동작 방식】  ← 인터랙션이 있는 경우 작성, 없으면 생략 가능
  - [트리거] : [결과 동작] 설명
  ================================================================
-->
```

**작성 기준**

| 항목 | 내용 |
|------|------|
| 익스텐션 이름 | 위젯의 핵심 기능을 명사형으로 (예: 우측 고정 상담 신청 폼, 배너 슬라이더) |
| 대상 업종/용도 | 주요 사용처 (예: 피부과·의원·클리닉 / 쇼핑몰 프로모션) |
| 페이지 개요 | 2~4줄. UI 형태 + 반응형 동작 + 목적 + 적합 업종 순으로 기술 |
| SEO 키워드 | 5개 내외, 실제 검색어 기준으로 작성 |
| 필수 설정 | 코드를 수정해야만 동작하는 항목 우선. API 연동은 반드시 ★ 표시 |
| 동작 방식 | 열기/닫기, 트리거, 전환 조건 등 인터랙션이 있을 때만 작성 |

### 샘플 데이터 폴백 패턴

모든 위젯은 **파일 상단에 샘플 데이터를 상수로 정의**하고, API 호출 실패 시 이를 그대로 렌더링합니다.
네트워크 오류, config_id 미설정, 개발 환경 등 어떤 상황에서도 UI가 비어 보이지 않도록 합니다.

```js
// 1) 파일 상단에 샘플 데이터 정의
const SAMPLE_DATA = [
  {
    id: 'sample-1',
    main_img_url: 'https://placehold.co/800x400',
    title: '샘플 제목 1',
    content: '샘플 설명 텍스트입니다.',
    link: '#'
  },
  {
    id: 'sample-2',
    main_img_url: 'https://placehold.co/800x400',
    title: '샘플 제목 2',
    content: '샘플 설명 텍스트입니다.',
    link: '#'
  }
];

// 2) API 호출 — 실패 시 샘플 데이터로 폴백
async function fetchData() {
  let data = SAMPLE_DATA; // 기본값: 샘플 데이터

  try {
    const res = await axios.get('https://api.di-bo.me/block?config_id=copy_config_id', {
      headers: { 'access-token': diboToken }
    });
    if (res.data?.length) data = res.data; // API 성공 시 실제 데이터로 교체
  } catch (e) {
    // API 실패 → SAMPLE_DATA 그대로 유지, 렌더링 계속 진행
  }

  render(data); // 항상 렌더링 실행
}
```

> **원칙**: `catch` 블록에서 렌더링을 중단하지 않습니다. 에러 로그만 남기고 샘플 데이터로 UI를 구성합니다.  
> **샘플 데이터 기준**: API Response 스펙과 동일한 구조로 작성하며, 실제 서비스 디자인을 확인할 수 있을 만큼 2~4개 항목을 포함합니다.

### 토큰 변수명 참고

| 사용처 | 변수명 |
|--------|--------|
| Block, Timer GET | `diboToken` |
| Edit GET (목록/rows 조회) | `diboLoginManager.access_token` |
| Edit POST (데이터 생성) | `diboLoginManager?.access_token` |

---

## 1. Block API

배너, 카드 리스트(링크 이동), 갤러리, 슬라이드 등 **이미지 + 텍스트 + 링크** 구성 요소에 사용.
`title`/`content`로 캡션 처리, `link`로 CTA(콜 투 액션) 연결 등 다양한 UX에 응용 가능.

### GET `/block?config_id=copy_config_id`

저장된 블록 목록을 반환합니다.

**Response**
```json
[
  {
    "id": "string",
    "client_id": "string",
    "config_id": "string",
    "main_img_url": "string",
    "sub_img_url": "string",
    "title": "string",
    "content": "string",
    "link": "string",
    "display_order": 0,
    "created_at": "2026-04-15T01:18:34.243Z",
    "updated_at": "2026-04-15T01:18:34.243Z"
  }
]
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 블록 고유 ID |
| `main_img_url` | string | 대표 이미지 URL |
| `sub_img_url` | string | 보조 이미지 URL |
| `title` | string | 제목 (캡션 처리 등) |
| `content` | string | 설명 텍스트 |
| `link` | string | 연결 링크 URL (CTA) |
| `display_order` | number | 표시 순서 |

**사용 예시**
```js
const SAMPLE_DATA = [
  {
    id: 'sample-1',
    main_img_url: 'https://placehold.co/800x400',
    sub_img_url: '',
    title: '샘플 제목 1',
    content: '샘플 설명 텍스트입니다.',
    link: '#',
    display_order: 1
  },
  {
    id: 'sample-2',
    main_img_url: 'https://placehold.co/800x400',
    sub_img_url: '',
    title: '샘플 제목 2',
    content: '샘플 설명 텍스트입니다.',
    link: '#',
    display_order: 2
  }
];

async function fetchData() {
  let instData = SAMPLE_DATA;

  try {
    const response = await axios.get('https://api.di-bo.me/block?config_id=copy_config_id', {
      headers: { 'access-token': diboToken }
    });
    if (response.data?.length) instData = response.data;
  } catch (error) {
    console.error('Block API 호출 실패, 샘플 데이터로 렌더링:', error);
  }

  // instData를 이용해 UI 렌더링
}
```

---

## 2. Timer API

이벤트 시작/종료 카운트다운, 특정 기간 동안 표시되는 프로모션 배너, 서비스 오픈/마감 안내 등
**시간 기반 요소**에 사용. 여러 개의 타이머를 등록할 수 있으며, 배열 인덱스로 특정 타이머를 선택합니다.

### GET `/timer?config_id=copy_config_id`

저장된 타이머 목록을 반환합니다.

**Response**
```json
[
  {
    "id": "string",
    "client_id": "string",
    "config_id": "string",
    "started_at": "2026-04-15T01:19:31.165Z",
    "start_title": "string",
    "ended_at": "2026-04-15T01:19:31.165Z",
    "end_title": "string",
    "display_order": 0,
    "created_at": "2026-04-15T01:19:31.165Z",
    "updated_at": "2026-04-15T01:19:31.165Z"
  }
]
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 타이머 고유 ID |
| `started_at` | ISO 8601 | 타이머 시작 일시 |
| `start_title` | string | 시작 전 표시 제목 |
| `ended_at` | ISO 8601 | 타이머 종료 일시 |
| `end_title` | string | 종료 후 표시 제목 |
| `display_order` | number | 표시 순서 |

**사용 예시**
```js
const SAMPLE_TIMER = {
  id: 'sample-timer-1',
  started_at: new Date(Date.now() - 86400000).toISOString(), // 어제
  start_title: '이벤트 시작 전',
  ended_at: new Date(Date.now() + 7 * 86400000).toISOString(), // 7일 후
  end_title: '이벤트가 종료되었습니다.',
  display_order: 1
};

const fetchData = async () => {
  let instData = SAMPLE_TIMER;

  try {
    const res = await axios.get(`https://api.di-bo.me/timer?config_id=copy_config_id`, {
      headers: { 'access-token': diboToken }
    });
    if (res.data?.length) instData = res.data[0]; // [0]번째 타이머 선택 — 여러 개일 경우 인덱스 변경
  } catch (error) {
    console.error('Timer API 호출 실패, 샘플 데이터로 렌더링:', error);
  }

  // instData를 이용해 카운트다운 UI 렌더링
}
```

> **Tip**: 타이머가 여러 개인 경우 `res.data[0]`, `res.data[1]` 등 인덱스로 구분하여 사용합니다.

---

## 3. Edit API

입력폼 및 범용 데이터 수집에 사용. 최대 10개의 컬럼(`column_01` ~ `column_10`)이 다양한 타입을 지원합니다.
설정이 복잡하므로 가능하면 Block/Timer처럼 목적에 맞는 전용 API 사용 권장.

> 현재 프론트(클라이언트 영역)에서 **POST가 가능한 유일한 API**

---

### Step 1 — Edit Set ID 조회

#### GET `/edit-set?config_id=copy_config_id`

입력폼 설정과 `id`를 가져옵니다. 이후 rows API 호출 시 이 `id`를 사용합니다.

**Response**
```json
[
  {
    "id": "string",
    "client_id": "string",
    "config_id": "string",
    "column_set": [
      {
        "column": "column_1",
        "column_name": "string",
        "column_type": "single_line",
        "column_data": ["string"]
      }
    ],
    "created_at": "2026-04-15T01:59:08.418Z",
    "updated_at": "2026-04-15T01:59:08.418Z"
  }
]
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 입력폼 고유 ID → rows API에서 `입력폼_아이디`로 사용 |
| `column_set[].column` | string | 컬럼 키 (`column_1` ~ `column_10`) |
| `column_set[].column_name` | string | 컬럼 표시명 |
| `column_set[].column_type` | string | 컬럼 타입 (아래 타입 참고) |
| `column_set[].column_data` | array | 선택형 컬럼의 옵션 목록 |

**사용 예시**
```js
// Edit API는 POST 전송용이므로 form_id 미확보 시 제출 버튼 비활성화로 처리
const fetchIdData = async () => {
  try {
    const res = await axios.get(`https://api.di-bo.me/edit-set?config_id=copy_config_id`, {
      headers: { 'access-token': diboLoginManager.access_token }
    });
    const instData = res.data;
    const form_id = instData[0]?.id; // 첫 번째 입력폼의 id 추출
    return form_id;
  } catch (error) {
    console.error("입력폼 목록 조회 실패:", error);
    return null; // null 반환 → 호출부에서 제출 버튼 비활성화 등 처리
  }
}
```

---

### Step 2 — 저장된 데이터 목록 조회

#### GET `/edit-set/${'입력폼_아이디'}/rows?config_id=copy_config_id`

해당 입력폼에 저장된 모든 Row 데이터를 반환합니다.

**사용 예시**
```js
const SAMPLE_ROWS = [
  { id: 'sample-row-1', column_01: '홍길동', column_02: '문의 내용 샘플입니다.', column_03: '' },
  { id: 'sample-row-2', column_01: '김철수', column_02: '두 번째 샘플 문의입니다.', column_03: '' }
];

const fetchListData = async () => {
  let instData = SAMPLE_ROWS;

  try {
    const res = await axios.get(`https://api.di-bo.me/edit-set/${'입력폼_아이디'}/rows?config_id=copy_config_id`, {
      headers: { 'access-token': diboToken }
    });
    if (res.data?.length) instData = res.data;
  } catch (error) {
    console.error("입력폼 데이터 조회 실패, 샘플 데이터로 렌더링:", error);
  }

  // instData를 이용해 리스트 UI 렌더링
}
```

---

### Step 3 — 데이터 제출 (POST)

#### POST `/edit-set/${'입력폼_아이디'}/rows`

입력폼 데이터를 서버에 저장합니다. `multipart/form-data` 형식으로 전송합니다.

**Request Body** (`FormData`)

| 필드 | 설명 |
|------|------|
| `req_body` | `{ config_id: 'copy_config_id' }` JSON 문자열 |
| `column_01` ~ `column_10` | 각 컬럼 값 (미사용 컬럼은 빈 문자열 `''`) |

**사용 예시**
```js
const postEditData = async () => {
  const formData = new FormData();
  formData.append('req_body', JSON.stringify({ config_id: 'copy_config_id' }));
  formData.append('column_01', '');
  formData.append('column_02', '');
  formData.append('column_03', '');
  formData.append('column_04', '');
  formData.append('column_05', '');
  formData.append('column_06', '');
  formData.append('column_07', '');
  formData.append('column_08', '');
  formData.append('column_09', '');
  formData.append('column_10', '');

  try {
    const res = await axios.post(
      `https://api.di-bo.me/edit-set/${'입력폼_아이디'}/rows`,
      formData,
      {
        headers: {
          'access-token': diboLoginManager?.access_token
        }
      }
    );
  } catch (error) {
    console.error("입력폼 데이터 생성 실패:", error);
  }
}
```

---

### 컬럼 타입 (column_type) 레퍼런스

백오피스 설정값(`column_type`)과 실제 입력 성격을 함께 정리합니다.

| # | column_type 값 | 입력 형태 | 설명 |
|---|---------------|-----------|------|
| 0 | `single_line` | 한 줄 텍스트 | 이름, 제목 등 단문 입력. `maxLength`, `pattern`(정규식) 설정 가능 |
| 1 | `multi_line` | 여러 줄 텍스트 | 설명, 문의 내용, 자기소개 등 장문 입력. `rows`, `maxLength` 설정 가능 |
| 2 | `single_selection` | 단일 선택 | 드롭다운/라디오 형태. 지역, 카테고리 등. `options`, `placeholder` 설정 가능 |
| 3 | `checkbox` | 체크박스 | 단일/복수 체크. 동의 체크, 옵션 선택 등. `options`가 1개면 동의 체크로 활용 |
| 4 | `list_selection` | 다중 선택 | 태그, 관심사 등 복수 선택. `options`, `maxSelections` 설정 가능 |
| 5 | `phone` | 전화번호 | 전화번호 형식 전용 입력 |
| 6 | `email` | 이메일 | 이메일 형식 자동 검증. `verify`(확인 입력 필드) 추가 가능 |
| 7 | `date` | 날짜/시간 | 날짜 또는 날짜+시간 선택기. `minDate`, `maxDate` 설정 가능 |
| 8 | `file` | 파일 업로드 | 이미지, PDF 등. `accept`(허용 확장자), `maxSizeMB`, `multiple`(다중) 설정 가능 |

> **공통 옵션**: 모든 타입에 `label`, `name`, `required`, `placeholder`, `helpText`, `defaultValue` 설정 가능

---

### Edit API 제한 사항 및 권장사항

| 항목 | 내용 |
|------|------|
| 컬럼 수 제한 | 폼당 최대 **10개** 컬럼. 꼭 필요한 항목만 설계 |
| 타입 변경 주의 | 운영 중인 폼의 컬럼 타입 변경 시 기존 데이터와 호환성 문제 발생 가능 (예: `file` → `text` 변경 시 데이터 소실) |
| 파일 업로드 | 저장 용량, 보안(확장자 제한, 바이러스 검사) 정책 사전 확인 필요 |
| 개인정보 | 주민등록번호 등 민감정보 수집 금지 또는 암호화 필수. 개인정보 수집 시 `checkbox`로 동의 필드 의무화 |

---

## API 요약

| API | 엔드포인트 | 메서드 | 주요 용도 |
|-----|-----------|--------|-----------|
| Block | `/block` | GET | 배너, 카드 리스트, 갤러리, 슬라이드 등 이미지+링크 구성 |
| Timer | `/timer` | GET | 이벤트 카운트다운, 프로모션 배너, 오픈/마감 안내 |
| Edit — ID 조회 | `/edit-set` | GET | 입력폼 ID 및 컬럼 구성 확인 |
| Edit — 데이터 조회 | `/edit-set/{id}/rows` | GET | 저장된 입력 데이터 리스트 |
| Edit — 데이터 제출 | `/edit-set/{id}/rows` | POST | 입력폼 데이터 서버 저장 |
| Instagram Gallery | `/instagram/gallery` | GET | 인스타그램 연동 갤러리 데이터 |
| YouTube Gallery | `/youtube/gallery` | GET | 유튜브 채널 영상 갤러리 데이터 |
| Popup | `/popup` | GET | 모달 팝업 데이터 |
| Floating Button | `/floating` | GET | 플로팅 버튼 데이터 |
| Rolling Banner | `/rolling-banner` | GET | 롤링 배너 데이터 |

---

## 4. Instagram Gallery API

인스타그램 계정을 디보 백오피스에서 OAuth로 연동 후, 디보 서버가 Instagram Graph API에서 데이터를 주기적으로 동기화하여 저장합니다.
프론트 위젯은 디보 API만 호출하며 인스타그램 토큰은 절대 노출되지 않습니다.

### 아키텍처

```
[백오피스]                    [디보 서버]              [Instagram API]
 인스타 계정 OAuth 연동  →  토큰 저장 / DB 동기화  →  이미지 데이터 수신
                              ↓
[프론트 갤러리 위젯]      ←  디보 API 응답
 디보 API 호출               (정제된 갤러리 데이터)
```

### GET `/instagram/gallery?config_id=copy_config_id`

**Response**
```json
[
  {
    "id": "string",
    "imageUrl": "https://...",
    "permalink": "https://www.instagram.com/p/...",
    "caption": "string",
    "timestamp": "2026-04-16T00:00:00"
  }
]
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 인스타그램 미디어 ID |
| `imageUrl` | string | 이미지 URL |
| `permalink` | string | 인스타그램 원본 게시물 링크 |
| `caption` | string | 게시물 캡션 |
| `timestamp` | ISO 8601 | 게시물 작성 일시 |

**사용 예시**
```js
const SAMPLE_INSTAGRAM = [
  { id: 'sample-ig-1', imageUrl: 'https://placehold.co/600x600', permalink: '#', caption: '샘플 게시물 캡션 1', timestamp: '2026-01-01T00:00:00' },
  { id: 'sample-ig-2', imageUrl: 'https://placehold.co/600x600', permalink: '#', caption: '샘플 게시물 캡션 2', timestamp: '2026-01-02T00:00:00' },
  { id: 'sample-ig-3', imageUrl: 'https://placehold.co/600x600', permalink: '#', caption: '샘플 게시물 캡션 3', timestamp: '2026-01-03T00:00:00' }
];

const fetchData = async () => {
  let instData = SAMPLE_INSTAGRAM;

  try {
    const res = await axios.get('https://api.di-bo.me/instagram/gallery?config_id=copy_config_id', {
      headers: { 'access-token': diboToken }
    });
    if (res.data?.length) instData = res.data;
  } catch (error) {
    console.error('Instagram API 호출 실패, 샘플 데이터로 렌더링:', error);
  }

  // instData를 이용해 갤러리 UI 렌더링
}
```

---

## 5. YouTube Gallery API

채널 ID만 입력하면 디보 서버가 YouTube Data API v3를 통해 영상 목록을 가져옵니다.
API Key는 디보 서버에 보관되며 프론트에 노출되지 않습니다.

### GET `/youtube/gallery?config_id=copy_config_id`

**Response**
```json
[
  {
    "id": "string",
    "title": "string",
    "thumbnailUrl": "https://...",
    "videoUrl": "https://www.youtube.com/watch?v=...",
    "publishedAt": "2026-04-16T00:00:00"
  }
]
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 유튜브 영상 ID |
| `title` | string | 영상 제목 |
| `thumbnailUrl` | string | 썸네일 이미지 URL |
| `videoUrl` | string | 유튜브 영상 링크 |
| `publishedAt` | ISO 8601 | 영상 게시 일시 |

**사용 예시**
```js
const SAMPLE_YOUTUBE = [
  { id: 'sample-yt-1', title: '샘플 영상 제목 1', thumbnailUrl: 'https://placehold.co/480x270', videoUrl: '#', publishedAt: '2026-01-01T00:00:00' },
  { id: 'sample-yt-2', title: '샘플 영상 제목 2', thumbnailUrl: 'https://placehold.co/480x270', videoUrl: '#', publishedAt: '2026-01-02T00:00:00' },
  { id: 'sample-yt-3', title: '샘플 영상 제목 3', thumbnailUrl: 'https://placehold.co/480x270', videoUrl: '#', publishedAt: '2026-01-03T00:00:00' }
];

const fetchData = async () => {
  let instData = SAMPLE_YOUTUBE;

  try {
    const res = await axios.get('https://api.di-bo.me/youtube/gallery?config_id=copy_config_id', {
      headers: { 'access-token': diboToken }
    });
    if (res.data?.length) instData = res.data;
  } catch (error) {
    console.error('YouTube API 호출 실패, 샘플 데이터로 렌더링:', error);
  }

  // instData를 이용해 갤러리 UI 렌더링
}
```

---

## 6. Popup API

모달 팝업 데이터를 반환합니다. 서버에서 `status=active` 조건과 `schedule` 기간을 동시에 체크하여 현재 노출 가능한 팝업만 내려줍니다(`schedule_type=always`이거나, `period`이면서 현재 시각이 시작~종료 범위 안인 경우).
"오늘 하루 보지 않기" 기능은 프론트에서 Cookie로 처리하며 DB 저장이 필요 없습니다.
토스트 알림(우측하단에 나오는 토스트 알림창)도 해당 내용으로 설정 가능

> **인증 참고**: subscribe-token으로 호출 시, 토큰의 `site_id`와 `config_id`의 `site_id`가 다르면 403을 반환합니다 (cross-site 차단).
> 관리자용 `GET /popup/admin?config_id=`은 상태·일정 필터 없이 전체 팝업 목록을 반환합니다.

### GET `/popup?config_id=copy_config_id`

**Response**
```json
[
  // 익스텐션 공통 설정은따로 없음
  // 디보 관리 기능쪽에 나오는 데이터 리스트
  {
    "id": "string",
    "status": "active",
    "schedule": {
      "type": "always",
      "startAt": null,
      "endAt": null
    },
    "title": "string",
    "description": "string",
    "imageUrl": "https://...",
    "linkUrl": "https://...",
    "linkTarget": "_blank",
    "showPages": []
  }
]
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 팝업 고유 ID |
| `status` | string | `active` \| `inactive` |
| `schedule.type` | string | `always` \| `period` |
| `schedule.startAt` | ISO 8601 \| null | 노출 시작 일시 |
| `schedule.endAt` | ISO 8601 \| null | 노출 종료 일시 |
| `title` | string | 한 줄 제목 |
| `description` | string | 여러 줄 설명 텍스트 |
| `imageUrl` | string | 팝업 이미지 URL |
| `linkUrl` | string | 클릭 시 이동 URL |
| `linkTarget` | string | `_self` \| `_blank` |
| `showPages` | array | 특정 페이지만 노출 시 경로 배열, 빈 배열이면 전체 페이지 |

**사용 예시**
```js
const SAMPLE_POPUP = [
  {
    id: 'sample-popup-1',
    status: 'active',
    schedule: { type: 'always', startAt: null, endAt: null },
    title: '샘플 팝업 제목',
    description: '샘플 팝업 설명 텍스트입니다.',
    imageUrl: 'https://placehold.co/600x400',
    linkUrl: '#',
    linkTarget: '_blank',
    showPages: []
  }
];

const fetchData = async () => {
  let instData = SAMPLE_POPUP;

  try {
    const res = await axios.get('https://api.di-bo.me/popup?config_id=copy_config_id', {
      headers: { 'access-token': diboToken }
    });
    if (res.data?.length) instData = res.data;
  } catch (error) {
    console.error('Popup API 호출 실패, 샘플 데이터로 렌더링:', error);
  }

  // instData를 이용해 팝업 UI 렌더링
}
```

### 오늘 하루 보지 않기 — 프론트 Cookie 처리

```js
// hideType 별 저장 방식
// today   → Cookie 저장, 오늘 자정 만료
// days    → Cookie 저장, N일 후 만료
// session → sessionStorage
// forever → localStorage

// 팝업 노출 여부 체크
const key = `popup_hidden_${popup.id}`;
if (document.cookie.includes(key)) return; // 쿠키 있으면 노출 안함

// "오늘 하루 보지 않기" 클릭 시
const expires = new Date();
expires.setHours(23, 59, 59, 0);
document.cookie = `${key}=1; expires=${expires.toUTCString()}; path=/`;
```

---

## 7. Floating Button API

플로팅 버튼 데이터를 반환합니다. `mode`가 `single`이면 단일 버튼, `expandable`이면 클릭 시 메뉴가 펼쳐집니다.

> **인증 참고**: subscribe-token으로 호출 시, 토큰의 `site_id`와 `config_id`의 `site_id`가 다르면 403을 반환합니다 (cross-site 차단).

### GET `/floating?config_id=copy_config_id`

**Response**
```json
{
  // 익스텐션 공통 설정 부분
  "display": {
    "showOn": "all",
    "showPages": [],
    "showDelay": 0,
    "hideOnMobile": false,
    "hideOnDesktop": false
  },
  "design": {
    "mode": "single",
    "vertical": "bottom",
    "horizontal": "right",
    "offsetX": 24,
    "offsetY": 24,
    "width": 48,
    "height": 48,
    "borderRadius": 24,
    "triggerIcon": "plus",
    "triggerIconOpen": "x"
  },
  // 디보 관리 기능쪽 데이터 리스트에 나오는 것들
  "items": [
    {
      "id": "string",
      "order": 1,
      "label": "string",
      "iconUrl": "https://...",
      "linkUrl": "https://...",
      "linkTarget": "_blank"
    }
  ]
}
```

**display**

| 필드 | 타입 | 설명 |
|------|------|------|
| `showOn` | string | `all` \| `specific` \| `exclude` |
| `showPages` | array | `showOn`이 `specific` \| `exclude` 일때 페이지 경로 배열 |
| `showDelay` | number | 페이지 진입 후 N초 뒤 노출 |
| `hideOnMobile` | boolean | 모바일 숨김 여부 |
| `hideOnDesktop` | boolean | 데스크탑 숨김 여부 |

**design**

| 필드 | 타입 | 설명 |
|------|------|------|
| `mode` | string | `single` \| `expandable` |
| `vertical` | string | `top` \| `bottom` |
| `horizontal` | string | `left` \| `right` |
| `offsetX` | number | 가장자리로부터 X 거리 (px) |
| `offsetY` | number | 가장자리로부터 Y 거리 (px) |
| `width` | number | 버튼 너비 (px) |
| `height` | number | 버튼 높이 (px) |
| `borderRadius` | number | 버튼 모서리 반경 (px) |
| `triggerIcon` | string | 닫힌 상태 아이콘 (`expandable` 전용) |
| `triggerIconOpen` | string | 펼쳐진 상태 아이콘 (`expandable` 전용) |

**items**

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 버튼 고유 ID |
| `order` | number | 노출 순서 |
| `label` | string | 버튼 라벨 (툴팁 or 텍스트) |
| `iconUrl` | string | 버튼 아이콘 이미지 URL |
| `linkUrl` | string | 클릭 시 이동 URL |
| `linkTarget` | string | `_self` \| `_blank` |

> `mode=single` 이면 `items[0]`만 사용, `mode=expandable` 이면 `items` 전체를 메뉴로 렌더링

**사용 예시**
```js
const SAMPLE_FLOATING = {
  display: { showOn: 'all', showPages: [], showDelay: 0, hideOnMobile: false, hideOnDesktop: false },
  design: { mode: 'expandable', vertical: 'bottom', horizontal: 'right', offsetX: 24, offsetY: 24, width: 48, height: 48, borderRadius: 24, triggerIcon: 'plus', triggerIconOpen: 'x' },
  items: [
    { id: 'sample-float-1', order: 1, label: '카카오톡 문의', iconUrl: 'https://placehold.co/48x48', linkUrl: '#', linkTarget: '_blank' },
    { id: 'sample-float-2', order: 2, label: '전화 문의', iconUrl: 'https://placehold.co/48x48', linkUrl: 'tel:010-0000-0000', linkTarget: '_self' }
  ]
};

const fetchData = async () => {
  let instData = SAMPLE_FLOATING;

  try {
    const res = await axios.get('https://api.di-bo.me/floating?config_id=copy_config_id', {
      headers: { 'access-token': diboToken }
    });
    if (res.data) instData = res.data;
  } catch (error) {
    console.error('Floating API 호출 실패, 샘플 데이터로 렌더링:', error);
  }

  // instData를 이용해 플로팅 버튼 UI 렌더링
}
```

---

## 8. Rolling Banner API

롤링 배너 데이터를 반환합니다. 롤링 동작 설정(`rolling`)과 슬라이드 아이템(`items`)을 함께 반환합니다.

> **인증 참고**: subscribe-token으로 호출 시, 토큰의 `site_id`와 `config_id`의 `site_id`가 다르면 403을 반환합니다 (cross-site 차단).

### GET `/rolling-banner?config_id=copy_config_id`

**Response**
```json
{
  // 익스텐션 공통 설정 부분
  "rolling": {
    "autoPlay": true,
    "interval": 3000,
    "pauseOnHover": true,
    "loop": true,
    "direction": "horizontal",
    "transition": {
      "style": "slide",
      "duration": 500,
      "easing": "ease-in-out"
    }
  },
  // 디보 관리 기능쪽 데이터 리스트에 나오는 것들
  "items": [
    {
      "id": "string",
      "imageUrl": "https://...",
      "mobileImageUrl": "https://...",
      "videoUrl": null,
      "title": "string",
      "description": "string",
      "buttonLabel": "string",
      "linkUrl": "https://...",
      "linkTarget": "_blank"
    }
  ]
}
```

**rolling**

| 필드 | 타입 | 설명 |
|------|------|------|
| `autoPlay` | boolean | 자동 재생 여부 |
| `interval` | number | 슬라이드 전환 간격 (ms) |
| `pauseOnHover` | boolean | 마우스 오버 시 일시정지 |
| `loop` | boolean | 무한 반복 여부 |
| `direction` | string | `horizontal` \| `vertical` |
| `transition.style` | string | `slide` \| `fade` \| `zoom` \| `flip` \| `none` |
| `transition.duration` | number | 전환 애니메이션 시간 (ms) |
| `transition.easing` | string | `ease` \| `ease-in` \| `ease-out` \| `ease-in-out` \| `linear` |

**items**

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 슬라이드 고유 ID |
| `imageUrl` | string | 데스크탑 이미지 URL |
| `mobileImageUrl` | string | 모바일 이미지 URL (없으면 `imageUrl` 사용) |
| `videoUrl` | string \| null | 영상 URL (이미지 대신 사용 시) |
| `title` | string | 슬라이드 제목 |
| `description` | string | 슬라이드 설명 텍스트 |
| `buttonLabel` | string | CTA 버튼 텍스트 |
| `linkUrl` | string | 클릭 시 이동 URL |
| `linkTarget` | string | `_self` \| `_blank` |

**사용 예시**
```js
const SAMPLE_ROLLING = {
  rolling: {
    autoPlay: true, interval: 3000, pauseOnHover: true, loop: true, direction: 'horizontal',
    transition: { style: 'slide', duration: 500, easing: 'ease-in-out' }
  },
  items: [
    { id: 'sample-roll-1', imageUrl: 'https://placehold.co/1200x500', mobileImageUrl: 'https://placehold.co/600x400', videoUrl: null, title: '샘플 슬라이드 1', description: '슬라이드 설명 텍스트입니다.', buttonLabel: '자세히 보기', linkUrl: '#', linkTarget: '_blank' },
    { id: 'sample-roll-2', imageUrl: 'https://placehold.co/1200x500', mobileImageUrl: 'https://placehold.co/600x400', videoUrl: null, title: '샘플 슬라이드 2', description: '슬라이드 설명 텍스트입니다.', buttonLabel: '자세히 보기', linkUrl: '#', linkTarget: '_blank' }
  ]
};

const fetchData = async () => {
  let instData = SAMPLE_ROLLING;

  try {
    const res = await axios.get('https://api.di-bo.me/rolling-banner?config_id=copy_config_id', {
      headers: { 'access-token': diboToken }
    });
    if (res.data) instData = res.data;
  } catch (error) {
    console.error('Rolling Banner API 호출 실패, 샘플 데이터로 렌더링:', error);
  }

  // instData를 이용해 롤링 배너 UI 렌더링
}
```

---

## 개발 로드맵 참고

- **Block, Timer**: 간단하고 직관적인 구조. 배너/타이머 외 다른 UX에 응용도 가능
- **Edit**: 범용성은 높지만 설정이 복잡 → 신규 UX 패턴에는 전용 API를 지속 추가할 예정
- **Instagram Gallery**: Meta 앱 심사 통과 후 사용 가능. OAuth 토큰은 디보 서버에서만 관리
- **YouTube Gallery**: 채널 ID만 입력하면 사용 가능. API Key는 디보 서버에 보관
- **Popup**: 오늘 하루 보지 않기는 프론트 Cookie로 처리, DB 불필요
- **Floating Button**: `mode`로 단일/확장형 구분. 확장형은 `items` 배열 전체를 메뉴로 렌더링
- **Rolling Banner**: 롤링 동작은 익스텐션 설정값으로 제어, 콘텐츠만 API로 관리
