# Board API 명세서 (사이트용)

> 대상: API 개발자  
> 현재 `data.js`의 하드코딩 데이터를 API 응답으로 교체하는 것을 목적으로 합니다.

---

## 1. 페이지 구성 개요

| 파일 | 역할 | 진입 조건 |
|---|---|---|
| `list.html` | 게시글 목록 | 항상 접근 가능 |
| `view.html?id={id}` | 게시글 상세 + 댓글 | 항상 접근 가능 |
| `write.html` | 게시글 작성 | 로그인 필요 (Standard 이상 구독) |

> **⚠️ 읽기/쓰기 접근 권한 관련 참고**
>
> 목록 조회, 상세 조회, 글 작성 등 **모든 페이지의 접근 권한(읽기/쓰기)은 별도로 구현하지 않습니다.**  
> 이 게시판이 삽입되는 서비스는 **Standard 구독 플랜에 포함된 회원 그룹별 권한 관리 기능**을 통해  
> 운영자가 직접 설정합니다. (예: 비회원은 목록만 열람, 회원만 글쓰기 허용 등)  
>
> API 개발자는 다음 사항만 인지하면 됩니다:
> - 클라이언트는 `member-token` 유무로 로그인 상태를 판단합니다.
> - 각 API 엔드포인트는 `member-token`을 Authorization 헤더로 수신하며, 토큰 유효성 및 권한 그룹 검증은 **기존 회원 권한 시스템이 처리**합니다.
> - 이 문서에서 "로그인 필요", "비로그인 허용" 등의 표현은 클라이언트 UI 분기 기준이며, 실제 서버 권한 강제는 권한 관리 시스템에 위임합니다.

---

## 2. 인증 방식

```
localStorage.getItem('member-token')
→ JSON.parse() → { id, name, ... }
```

- `member-token`이 없거나 null이면 **비로그인** 상태로 처리
- `id === 'admin'`이면 **관리자** 로 처리
- **Standard 구독 회원**부터 `member-token` 발급 (로그인 처리 가능)
- 비로그인 사용자는 댓글 작성 시 이름 + 비밀번호 입력 필요

---

## 3. 데이터 구조

### 3-1. 게시글 (Post)

```json
{
  "id": 1,
  "board_id": "notice",
  "category": "공지",
  "title": "2026년 상반기 서비스 업데이트 안내",
  "content": "<HTML 또는 텍스트>",
  "author": "관리자",
  "member_id": "admin",
  "date": "2026-04-10",
  "views": 342,
  "thumbnail": "https://...",
  "tags": ["공지", "업데이트"],
  "pinned": true,
  "is_public": true,
  "likes": 47,
  "dislikes": 2
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | 게시글 고유 ID |
| `board_id` | string | 게시판 식별자 (예: `notice`, `community`, `inquiry`) |
| `category` | string | 카테고리명 (표시용, 필터 기준) |
| `title` | string | 제목 |
| `content` | string | 본문 (Tiptap 에디터 HTML) |
| `author` | string | 작성자 표시명 |
| `member_id` | string \| null | 회원 ID (비회원 작성 시 null) |
| `date` | string | 작성일 `YYYY-MM-DD` |
| `views` | number | 조회수 |
| `thumbnail` | string | 썸네일 이미지 URL (없으면 빈 문자열) |
| `tags` | string[] | 태그 목록 |
| `pinned` | boolean | 공지 고정 여부 |
| `is_public` | boolean | 공개/비공개 |
| `likes` | number | 좋아요 수 |
| `dislikes` | number | 싫어요 수 |

---

### 3-2. 댓글 (Comment)

```json
{
  "id": 1,
  "post_id": 1,
  "member_id": "user01",
  "author": "홍길동",
  "date": "2026-04-11",
  "content": "댓글 내용",
  "images": ["https://..."],
  "likes": 12,
  "pinned": false,
  "secret": false,
  "password": null,
  "is_hidden": false,
  "report_count": 0
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | 댓글 고유 ID |
| `post_id` | number | 연결된 게시글 ID |
| `member_id` | string \| null | 회원 ID (비회원은 null) |
| `author` | string | 작성자 표시명 |
| `date` | string | 작성일 |
| `content` | string | 댓글 내용 |
| `images` | string[] | 첨부 이미지 URL 목록 |
| `likes` | number | 좋아요 수 |
| `pinned` | boolean | 관리자 고정 여부 |
| `secret` | boolean | 비밀댓글 여부 |
| `password` | string \| null | 비회원 비밀번호 (해시 처리 필요) |
| `is_hidden` | boolean | 관리자 숨김 처리 여부 |
| `report_count` | number | 신고 횟수 |

---

### 3-3. 대댓글 (Reply)

```json
{
  "id": 1,
  "comment_id": 1,
  "member_id": "admin",
  "author": "관리자",
  "date": "2026-04-11",
  "content": "대댓글 내용",
  "images": [],
  "likes": 5,
  "secret": false,
  "password": null,
  "is_hidden": false,
  "report_count": 0
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | 대댓글 고유 ID |
| `comment_id` | number | 연결된 댓글 ID |
| 나머지 | — | 댓글 구조와 동일 (`post_id`, `pinned` 제외) |

---

### 3-4. 회원 활동 내역 (My Activity)

> 로그인 회원이 **나의 활동 내역** 페이지에서 조회하는 데이터

```json
{
  "member_id": "user01",
  "my_posts": [/* Post 배열 */],
  "liked_posts": [/* Post 배열 */],
  "disliked_posts": [/* Post 배열 */],
  "reported_posts": [/* Post 배열 */]
}
```

각 항목은 게시글 목록 형태(id, title, board_id, date, category)로 반환하면 충분합니다.

---

## 4. API 엔드포인트 목록

### 게시판 (board_id별 독립 운영)

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/boards` | 전체 게시판 목록 (board_id, 이름, 카테고리 목록) |
| GET | `/boards/{board_id}/posts` | 게시글 목록 (쿼리 파라미터로 필터/검색/페이지) |
| GET | `/boards/{board_id}/posts/{id}` | 게시글 상세 (조회수 +1) |
| POST | `/boards/{board_id}/posts` | 게시글 작성 (인증 필요) |
| PUT | `/boards/{board_id}/posts/{id}` | 게시글 수정 (본인 또는 관리자) |
| DELETE | `/boards/{board_id}/posts/{id}` | 게시글 삭제 (본인 또는 관리자) |

### 좋아요 / 싫어요 / 신고

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/posts/{id}/like` | 좋아요 토글 |
| POST | `/posts/{id}/dislike` | 싫어요 토글 |
| POST | `/posts/{id}/report` | 게시글 신고 |

### 댓글

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/posts/{post_id}/comments` | 댓글 + 대댓글 목록 |
| POST | `/posts/{post_id}/comments` | 댓글 작성 |
| PUT | `/comments/{id}` | 댓글 수정 |
| DELETE | `/comments/{id}` | 댓글 삭제 |
| POST | `/comments/{id}/like` | 댓글 좋아요 토글 |
| POST | `/comments/{id}/report` | 댓글 신고 |
| POST | `/comments/{comment_id}/replies` | 대댓글 작성 |
| PUT | `/replies/{id}` | 대댓글 수정 |
| DELETE | `/replies/{id}` | 대댓글 삭제 |

### 회원 활동 내역

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/members/me/posts` | 내가 작성한 게시글 |
| GET | `/members/me/liked-posts` | 내가 좋아요한 게시글 |
| GET | `/members/me/disliked-posts` | 내가 싫어요한 게시글 |
| GET | `/members/me/reported-posts` | 내가 신고한 게시글 |

---

## 5. 게시글 목록 쿼리 파라미터

```
GET /boards/{board_id}/posts?category=공지&q=검색어&page=1&limit=5&sort=latest
```

| 파라미터 | 기본값 | 설명 |
|---|---|---|
| `category` | — | 카테고리 필터 (없으면 전체) |
| `q` | — | 제목 검색어 |
| `page` | 1 | 페이지 번호 |
| `limit` | 5 | 페이지당 게시글 수 |
| `sort` | `latest` | `latest` \| `popular` |

**응답 구조**

```json
{
  "total": 42,
  "page": 1,
  "limit": 5,
  "posts": [ /* Post 배열 */ ]
}
```

---

## 6. 로그인 / 비로그인 처리 분기

> 아래 분기는 **클라이언트 UI 렌더링 기준**입니다.  
> 페이지별 실제 접근 허용 범위(비회원 열람 가능 여부 등)는 **Standard 구독의 회원 그룹별 권한 관리**에서 운영자가 설정하며, API 서버는 해당 권한 시스템의 결과를 그대로 따릅니다.

### 게시글 작성 (write.html)
| 상태 | 처리 |
|---|---|
| 로그인 | `member-token`에서 author, member_id 자동 입력 |
| 비로그인 | 접근 차단 (Standard 구독 필요 안내) |

### 댓글 작성
| 상태 | 처리 |
|---|---|
| 로그인 | author = 회원 표시명, member_id = 회원 ID |
| 비로그인 | author = 직접 입력, password = 직접 입력 (수정/삭제 시 검증) |
| 관리자 | author = "관리자", 비밀글 열람 및 삭제 권한 |

### 비밀댓글 열람
| 상태 | 열람 가능 여부 |
|---|---|
| 작성자 본인 (로그인) | O |
| 관리자 | O |
| 비회원 작성자 | 비밀번호 입력 후 열람 |
| 그 외 | 🔒 비밀글입니다. 표시 |

### 게시글 좋아요 / 싫어요 / 신고
- 현재 클라이언트는 `_myVotes` (Map), `_myReports` (Set)로 세션 내 중복 방지
- API 연동 후에는 회원 ID + post_id 기준으로 서버에서 중복 체크 처리

---

## 7. 댓글 정렬

- **인기댓글순** (`top`): `pinned` 우선, 이후 `likes` 내림차순
- **최신순** (`new`): `pinned` 우선, 이후 `date` 내림차순

---

## 8. 기타 정책

- 조회수: `view.html` 진입 시 해당 게시글 조회수 +1
- 고정 게시글(`pinned: true`): 목록 최상단 고정, 순번 대신 📌 아이콘 표시
- 태그: 목록에서 최대 2개 표시
- 썸네일: 없는 경우 빈 문자열, 미표시
- 게시글 본문: Tiptap 에디터 HTML 형식 (sanitize 처리 권장)
- 비회원 댓글 비밀번호: 서버에서 해시 저장 및 검증 처리 필요
