# 익스텐션 3종 — 팝업 / 플로팅 버튼 / 롤링 배너

- 작성일: 2026-05-19
- 관련 커밋: `62c0559`, `afb2a82`, `9e9148a`
- 관련 PR: [#17](https://github.com/diboBackofficeSolution/dibo-api/pull/17), [#18](https://github.com/diboBackofficeSolution/dibo-api/pull/18)

디보 익스텐션에 새로 추가된 위젯 3종(팝업, 플로팅 버튼, 롤링 배너)의 데이터 모델·API·동작과 추가 이후의 변경 이력을 정리한 문서다.

---

## 1. 개요

구독자(클라이언트)가 자기 사이트에 붙이는 위젯 3종이다. 디보 관리 화면에서 내용을 설정하고, 외부 사이트가 위젯 API로 호출해 노출한다.

- **팝업(Popup)** — 사이트 진입 시 노출되는 팝업. 노출 일정(상시/기간)을 가진다. API prefix `/popup`
- **플로팅 버튼(Floating Button)** — 화면 모서리에 고정되는 버튼/메뉴. API prefix `/floating`
- **롤링 배너(Rolling Banner)** — 자동 전환되는 슬라이드 배너. API prefix `/rolling-banner`

### 커밋 이력

- `62c0559` (2026-05-17, PR #17) — 익스텐션 3종 API 최초 추가
- `afb2a82` (2026-05-17, PR #17) — 3종 단위·E2E 테스트 추가
- `9e9148a` (2026-05-18, PR #18) — 이미지 파일 업로드 지원 및 데이터 정합성 보강

---

## 2. 익스텐션 시스템 안에서의 위치

3종은 디보 익스텐션 체계 위에서 동작한다.

- **Extension** — 익스텐션 종류 마스터. `ExtensionType` enum 값으로 구분(`popup` / `floating` / `rolling_banner` 등). 62c0559에서 enum에 3종 값이 추가됐다.
- **ExtensionConfig** — 클라이언트가 특정 사이트에 익스텐션을 추가한 단위(`client_id` + `site_id` + `extension_id`). `status`가 `disapproved` → `approved`로 바뀌어야 관리 API가 동작한다.
- **익스텐션 데이터** — ExtensionConfig에 종속된 실제 콘텐츠(팝업·플로팅·롤링 행).

동작 흐름:

1. 클라이언트가 ExtensionConfig를 추가하고 활성화(`approved`)한다.
2. 디보 관리 화면에서 관리 API로 위젯 데이터를 추가·수정·삭제한다.
3. 외부 사이트가 위젯 GET API를 호출해 노출한다.

ExtensionConfig 생성·삭제 시 공통 로직을 탄다.

- 생성: `create_extension_config` → 해당 종류에 등록된 `ExtensionSample`이 있으면 `create_sample_data`로 초기 데이터 생성
- 삭제: `delete_extension_data`로 종속 데이터 정리

---

## 3. 데이터 모델

`docs/migrations/2026-05-13-add-popup-floating-rolling.sql`로 `dibo` 스키마에 5개 테이블이 추가됐다.

**PK 규칙** — 2글자 prefix + 11자 본체 = 13자. `client_id` / `config_id`는 기존 테이블과 동일하게 12자다.

- `PO` — 팝업
- `FL` — 플로팅 설정 / `FI` — 플로팅 아이템
- `RB` — 롤링 설정 / `RI` — 롤링 아이템

### 3.1 extension_popup

ExtensionConfig 하나에 팝업 여러 개가 달린다(`config_id` 인덱스).

- `status` — `active` / `inactive` (기본 `active`)
- `schedule_type` — `always` / `period` (기본 `always`)
- `schedule_started_at`, `schedule_ended_at` — 기간 노출 시 시작·종료
- `title`(필수, 128자), `description`, `image_url`, `link_url`, `link_target`(기본 `_blank`)
- `show_pages` — 노출 페이지 목록(JSON)
- `display_order` — 정렬 순서

### 3.2 extension_floating / extension_floating_item

플로팅 설정은 ExtensionConfig당 1행이다(`config_id` UNIQUE). 아이템(버튼 항목)은 여러 개다.

`extension_floating` (표시·디자인 설정)

- 표시: `show_on`(`all`/`specific`/`exclude`), `show_pages`, `show_delay`, `hide_on_mobile`, `hide_on_desktop`
- 디자인: `mode`(`single`/`expandable`), `vertical`(`top`/`bottom`), `horizontal`(`left`/`right`), `offset_x`, `offset_y`, `width`, `height`, `border_radius`, `trigger_icon`, `trigger_icon_open`

`extension_floating_item`

- `floating_id` — 소속 floating 설정 FK
- `display_order`, `label`(128자), `icon_url`, `link_url`, `link_target`

### 3.3 extension_rolling / extension_rolling_item

롤링 설정도 ExtensionConfig당 1행이다(`config_id` UNIQUE). 아이템(슬라이드)은 여러 개다.

`extension_rolling` (슬라이드 동작 설정)

- `auto_play`, `interval`(ms), `pause_on_hover`, `loop`
- `direction`(`horizontal`/`vertical`)
- `transition_style`(`slide`/`fade`/`zoom`/`flip`/`none`), `transition_duration`, `transition_easing`

`extension_rolling_item`

- `rolling_id` — 소속 rolling 설정 FK
- `image_url`, `mobile_image_url`, `video_url`
- `title`(128자), `description`, `button_label`(64자), `link_url`, `link_target`
- `display_order`

---

## 4. API 엔드포인트

prefix는 `app/main.py`에서 등록된다 — `/popup`, `/floating`, `/rolling-banner`.

### 4.1 팝업 `/popup`

- `GET /popup?config_id=` — 노출 가능한 팝업 목록(`status=active` + 일정 조건 충족). 외부 위젯·관리자 공용
- `GET /popup/admin?config_id=` — 전체 팝업 목록(상태·일정 무관). 관리자 전용
- `POST /popup` — 팝업 생성. **multipart** (`req_body` + `image`)
- `PUT /popup/reorder` — 순서 변경. JSON
- `PUT /popup/{popup_id}` — 팝업 수정. **multipart** (`req_body` + `image`)
- `DELETE /popup/{popup_id}?config_id=` — 팝업 삭제

### 4.2 플로팅 버튼 `/floating`

- `GET /floating?config_id=` — 설정 + 아이템 전체. 외부 위젯·관리자 공용
- `PUT /floating/config` — 표시·디자인 설정 upsert(없으면 생성). JSON
- `POST /floating/items` — 아이템 생성. **multipart** (`req_body` + `icon`)
- `PUT /floating/items/reorder` — 아이템 순서 변경. JSON
- `PUT /floating/items/{item_id}` — 아이템 수정. **multipart** (`req_body` + `icon`)
- `DELETE /floating/items/{item_id}?config_id=` — 아이템 삭제

아이템을 만들려면 먼저 `PUT /floating/config`로 설정 행이 존재해야 한다.

### 4.3 롤링 배너 `/rolling-banner`

- `GET /rolling-banner?config_id=` — 설정 + 아이템 전체. 외부 위젯·관리자 공용
- `PUT /rolling-banner/config` — 슬라이드 동작 설정 upsert. JSON
- `POST /rolling-banner/items` — 아이템 생성. **multipart** (`req_body` + `image` + `mobile_image`)
- `PUT /rolling-banner/items/reorder` — 아이템 순서 변경. JSON
- `PUT /rolling-banner/items/{item_id}` — 아이템 수정. **multipart** (`req_body` + `image` + `mobile_image`)
- `DELETE /rolling-banner/items/{item_id}?config_id=` — 아이템 삭제

---

## 5. 요청 / 응답 모델

### 5.1 요청 모델 (`commons/models/models.py`)

생성·수정 요청 본문(JSON, multipart 라우터에서는 `req_body` 필드에 담는다).

- **팝업** `ReqExtensionPopup` — `config_id`(필수), `title`(필수), `status`, `schedule_type`, `schedule_started_at`, `schedule_ended_at`, `description`, `link_url`, `link_target`, `show_pages`
- **플로팅 설정** `ReqExtensionFloatingConfig` — `config_id`, `show_on`, `show_pages`, `show_delay`, `hide_on_mobile`, `hide_on_desktop`, `mode`, `vertical`, `horizontal`, `offset_x`, `offset_y`, `width`, `height`, `border_radius`, `trigger_icon`, `trigger_icon_open`
- **플로팅 아이템** `ReqExtensionFloatingItem` — `config_id`, `label`, `link_url`, `link_target`
- **롤링 설정** `ReqExtensionRollingConfig` — `config_id`, `auto_play`, `interval`, `pause_on_hover`, `loop`, `direction`, `transition_style`, `transition_duration`, `transition_easing`
- **롤링 아이템** `ReqExtensionRollingItem` — `config_id`, `video_url`, `title`, `description`, `button_label`, `link_url`, `link_target`

이미지 URL 필드(`image_url` / `icon_url` / `mobile_image_url`)는 9e9148a에서 요청 모델에서 제거됐다(아래 7장 참조).

**입력 검증 규칙**

- 팝업: `title` ≤128자, `status` ∈ {active, inactive}, `schedule_type` ∈ {always, period}, `link_target` ∈ {_self, _blank}
- 플로팅 설정: `show_on` ∈ {all, specific, exclude}, `mode` ∈ {single, expandable}, `vertical` ∈ {top, bottom}, `horizontal` ∈ {left, right}
- 플로팅 아이템: `label` ≤128자, `link_target` ∈ {_self, _blank}
- 롤링 설정: `direction` ∈ {horizontal, vertical}, `transition_style` ∈ {slide, fade, zoom, flip, none}
- 롤링 아이템: `title` ≤128자, `button_label` ≤64자, `link_target` ∈ {_self, _blank}

### 5.2 응답 모델

응답은 camelCase 키로 내려간다.

- **팝업** `ExtensionPopup` — `id`, `status`, `schedule`{`type`, `startAt`, `endAt`}, `title`, `description`, `imageUrl`, `linkUrl`, `linkTarget`, `showPages`
- **플로팅** `ExtensionFloating` — `display`{`showOn`, `showPages`, `showDelay`, `hideOnMobile`, `hideOnDesktop`}, `design`{`mode`, `vertical`, `horizontal`, `offsetX`, `offsetY`, `width`, `height`, `borderRadius`, `triggerIcon`, `triggerIconOpen`}, `items`[{`id`, `order`, `label`, `iconUrl`, `linkUrl`, `linkTarget`}]
- **롤링** `ExtensionRolling` — `rolling`{`autoPlay`, `interval`, `pauseOnHover`, `loop`, `direction`, `transition`{`style`, `duration`, `easing`}}, `items`[{`id`, `imageUrl`, `mobileImageUrl`, `videoUrl`, `title`, `description`, `buttonLabel`, `linkUrl`, `linkTarget`}]

---

## 6. 공통 동작 / 권한

### 인증·권한

디보에는 관리자 토큰(admin-token)과 외부 위젯용 구독 토큰(subscribe-token)이 있다.

- **조회(GET)** — admin-token, subscribe-token 모두 허용. 단 `GET /popup/admin`은 관리자 전용
- **변경(POST/PUT/DELETE)** — 관리자 전용. subscribe-token으로 호출하면 403

### cross-site 검증

subscribe-token으로 조회할 때, 토큰의 `site_id`와 대상 `config_id`의 `site_id`가 다르면 403을 반환한다(`_enforce_cross_site`). 다른 사이트의 위젯 데이터를 훔쳐보는 것을 막는다.

### 활성화 전 차단

ExtensionConfig가 `approved` 상태가 아니면 관리 API가 차단된다(`get_approved_config`).

### 팝업 노출 필터

`GET /popup`(외부 위젯용)은 노출 가능한 팝업만 반환한다 — `status=active` 그리고 (`schedule_type=always` 또는 `period`이면서 현재 시각이 시작~종료 범위 안). `GET /popup/admin`은 이 필터 없이 전체를 반환한다.

---

## 7. 이미지 업로드 (multipart) — 9e9148a

최초 추가(62c0559) 시점에는 팝업·롤링의 이미지, 플로팅의 아이콘이 **URL 문자열 필드**로만 정의돼 있었다. 운영자가 관리 화면에서 이미지 파일을 직접 올릴 수 없었고, 생성·수정 요청도 순수 JSON이라 파일 전송 자체가 불가능했다.

9e9148a에서 다음과 같이 바꿨다.

- 생성·수정 엔드포인트를 `multipart/form-data`로 전환. 본문 JSON은 `req_body` 필드에 JSON 문자열로 담고, 이미지는 별도 파일 필드로 첨부한다(파일 필드는 선택).
  - 팝업: `req_body` + `image`
  - 플로팅 아이템: `req_body` + `icon`
  - 롤링 아이템: `req_body` + `image` + `mobile_image`
- 요청 모델에서 이미지 URL 필드를 제거. 이미지는 파일로만 받고, 응답에는 S3 URL이 그대로 유지된다.
- 서비스 계층에서 row를 `flush()`로 확정한 뒤 `s3.upload_image()`로 S3에 올리고 URL을 반영한다.
- 수정 시 새 파일이 없으면 기존 이미지를 유지하고, 새 파일이 오면 S3에 올린 뒤 이전 이미지를 삭제한다.
- `config`·`reorder` 엔드포인트는 JSON을 유지한다.

S3 저장 경로

- 팝업: `client={client_id}/extension={config_id}/popup/`
- 플로팅 아이콘: `client={client_id}/extension={config_id}/floating/`
- 롤링 이미지: `.../rolling/image/`, 모바일 이미지: `.../rolling/mobile/`

multipart 요청 예시 (팝업 생성)

```
POST /popup
Content-Type: multipart/form-data

req_body = {"config_id":"...","title":"여름 세일","status":"active","schedule_type":"always","link_target":"_blank"}
image    = <이미지 파일>
```

---

## 8. 변경 이력 상세

### 62c0559 — 익스텐션 3종 API 최초 추가 (2026-05-17)

- 마이그레이션 SQL로 5개 테이블 추가(`docs/migrations/2026-05-13-add-popup-floating-rolling.sql`)
- 라우터 3개, 서비스 3개 추가
- `ExtensionType` enum에 `popup` / `floating` / `rolling_banner` 추가
- 요청·응답 모델 추가(`models.py`), Swagger 예시용 샘플 추가(`samples.py`)
- `app/main.py`에 라우터 등록

### afb2a82 — 단위·E2E 테스트 추가 (2026-05-17)

- 단위 테스트 3종(`test_01_popup.py`, `test_02_floating.py`, `test_03_rolling_banner.py`) — 인증/권한, 조회, CRUD, 순서 변경, 입력 검증
- E2E 시나리오(`test_e2e_scenario.py`) — Starter/Standard 구독자의 전체 유저플로우
- 공통 헬퍼(`tests/common.py`, `tests/extension/ext_helper.py`)

### 9e9148a — 이미지 업로드 + 데이터 정합성 보강 (2026-05-18, PR #18)

- **A. 이미지 파일 업로드** — 생성·수정 API를 multipart로 전환, S3 업로드 적용(7장 참조)
- **B. 샘플 데이터 생성 분기** — `create_sample_data`에 팝업·플로팅·롤링 분기 추가. 기존에는 블록·타이머·에디트만 분기가 있었다.
  - 다만 현재 `ExtensionSample` 테이블이 비어 있어, 어느 익스텐션도 실제 초기 샘플은 생성되지 않는다. 코드 분기만 갖춰 둔 상태이며, 운영자가 샘플 레코드를 넣으면 동작한다.
- **C. 설정 삭제 시 데이터 정리** — `delete_extension_data`에 팝업·플로팅·롤링 분기 추가. 기존에는 설정을 삭제해도 위젯 데이터가 남아 orphan 레코드가 쌓였다. 플로팅·롤링은 아이템 테이블도 함께 삭제한다.
- 테스트를 multipart 호출 방식으로 갱신(아래 9장)

---

## 9. 테스트

`tests/extension/` 아래에 있다. 서버를 띄운 상태에서 HTTP로 호출하는 방식이다.

```
set -a; source .env.local; set +a
.venv/bin/python tests/extension/run_all.py            # 단위 3종
.venv/bin/python tests/extension/test_e2e_scenario.py  # E2E 시나리오
```

- 단위 테스트 — 팝업 40건 + 플로팅 37건 + 롤링 36건 = **113건**
- E2E 시나리오 — Starter·Standard 구독자가 익스텐션을 자기 설정으로 추가·활성화 → 관리 API로 데이터 추가·수정·삭제 → 외부 사이트가 위젯 API로 호출 시 노출·수정반영·삭제반영까지 = **68건**

9e9148a의 multipart 전환으로 기존 테스트(JSON 호출 방식)가 깨졌고, 다음과 같이 갱신했다.

- `ext_helper.py`의 `req()` 헬퍼가 경로를 보고 전송 방식을 자동 결정 — `/config`·`/reorder`는 JSON, 그 외 POST/PUT은 multipart
- E2E는 같은 규칙으로 분기하는 `api_ext` 헬퍼를 추가
- 요청 body에 남아 있던 죽은 이미지 URL 필드 제거

현재 단위·E2E 합계 **181건 통과**.

---

## 10. 미검증 / 후속 확인 필요

- 이미지 파일이 실제로 S3에 업로드되는 동작은 로컬에서 검증하지 못했다. 로컬 환경에 S3 자격증명이 없기 때문이다.
- multipart 요청 처리 흐름(폼 파싱·`req_body` 검증·라우터→서비스 연결)은 테스트 181건이 모두 거치므로 검증됐다. S3 업로드 자체는 기존 블록 익스텐션의 검증된 `s3.upload_image()`를 그대로 호출하는 구조다.
- 실제 파일→S3 업로드는 운영 배포 후 또는 S3 개발 환경에서 한 번 확인이 필요하다.
- `ExtensionSample` 테이블이 비어 있어, 익스텐션 설정 추가 시 초기 샘플 데이터가 생성되지 않는다. 샘플 노출이 필요하면 운영자가 `ExtensionSample`에 레코드를 등록해야 한다.
