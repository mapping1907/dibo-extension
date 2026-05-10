/**
 * BOARD_DATA — 하드코딩 샘플 데이터
 * API 연동 시 이 파일 대신 fetch로 교체 예정
 */
const BOARD_DATA = [
  {
    id: 1,
    category: '공지',
    title: '2026년 상반기 서비스 업데이트 안내',
    content: `안녕하세요, DIBO 팀입니다.

2026년 상반기 서비스 업데이트 내용을 안내드립니다.

주요 변경사항은 다음과 같습니다.

• 신규 블록 8종 추가 (배너 슬라이더, 카드 그리드, 3D 캐러셀 등)
• 전반적인 성능 개선 및 렌더링 최적화
• 모바일 반응형 레이아웃 전면 개선
• 다크 모드 지원 강화
• 백오피스 API 연동 안정성 향상

앞으로도 더욱 발전된 서비스로 찾아뵙겠습니다.

감사합니다.`,
    author: '관리자',
    date: '2026-04-10',
    views: 342,
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    tags: ['공지', '업데이트'],
    pinned: true
  },
  {
    id: 2,
    category: '공지',
    title: '서비스 점검 안내 (4월 20일 02:00 ~ 04:00)',
    content: `안녕하세요, DIBO 팀입니다.

서비스 안정화를 위한 정기 점검이 예정되어 있습니다.

점검 일시: 2026년 4월 20일 (월) 새벽 02:00 ~ 04:00
점검 내용: 서버 인프라 업그레이드 및 DB 최적화

점검 시간 동안 서비스 이용이 일시 중단됩니다.
불편을 드려 죄송합니다.`,
    author: '관리자',
    date: '2026-04-08',
    views: 218,
    thumbnail: '',
    tags: ['공지', '점검'],
    pinned: true
  },
  {
    id: 3,
    category: '이벤트',
    title: '봄맞이 무료 블록 템플릿 증정 이벤트',
    content: `봄을 맞아 특별 이벤트를 진행합니다!

이벤트 기간: 2026년 4월 1일 ~ 4월 30일
대상: 전체 회원

참여 방법:
1. 이벤트 페이지 접속
2. 원하는 무료 템플릿 선택
3. 내 계정에 추가

총 15종의 프리미엄 블록 템플릿을 무료로 제공합니다.
이번 기회를 놓치지 마세요!`,
    author: '마케팅팀',
    date: '2026-04-01',
    views: 891,
    thumbnail: 'https://images.unsplash.com/photo-1490750967868-88df5691cc5d?w=800&q=80',
    tags: ['이벤트', '무료', '템플릿'],
    pinned: false
  },
  {
    id: 4,
    category: '일반',
    title: '배너 슬라이더 커스터마이징 팁 공유',
    content: `배너 슬라이더를 더 멋지게 활용하는 방법을 공유합니다.

1. 자동 전환 속도 조절
LOCAL_DATA 아래 INTERVAL 값을 수정하면 슬라이드 전환 속도를 바꿀 수 있습니다.

2. 진행 바 색상 변경
CSS의 --apple-blue 변수를 원하는 컬러로 교체하세요.

3. 슬라이드 높이 조정
.slide 클래스의 height 값을 조정하면 됩니다.

도움이 되셨으면 좋겠습니다!`,
    author: '홍길동',
    date: '2026-04-05',
    views: 156,
    thumbnail: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80',
    tags: ['팁', '배너', '커스터마이징'],
    pinned: false
  },
  {
    id: 5,
    category: '질문',
    title: '카드 그리드에서 hover 이미지 전환이 안 되는 경우',
    content: `카드 그리드 블록을 사용하다가 hover 시 이미지 전환이 안 되는 문제를 겪었습니다.

원인을 찾아보니 sub_img_url 값이 비어 있을 때 발생하더라고요.

LOCAL_DATA에서 sub_img_url을 반드시 채워주세요.
비워두면 기본 이미지도 사라지는 버그가 있는 것 같습니다.

혹시 다른 원인 아시는 분 계시면 댓글 부탁드립니다.`,
    author: '김철수',
    date: '2026-04-03',
    views: 87,
    thumbnail: '',
    tags: ['질문', '카드그리드', '버그'],
    pinned: false
  },
  {
    id: 6,
    category: '일반',
    title: '메이슨리 갤러리로 포트폴리오 사이트 만든 후기',
    content: `갤러리 메이슨리 블록을 활용해서 포트폴리오 사이트를 만들었습니다.

처음엔 복잡할 것 같았는데 LOCAL_DATA만 채워주면 바로 완성되더라고요.

특히 좋았던 점:
- 모달 팝업 뷰어가 기본으로 내장되어 있어서 별도 작업이 없었음
- 이미지 비율이 자동으로 메이슨리 배치됨
- 다크 테마라 사진이 더 돋보임

클라이언트도 매우 만족해 했습니다. 추천드려요!`,
    author: '이영희',
    date: '2026-03-28',
    views: 203,
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    tags: ['후기', '갤러리', '포트폴리오'],
    pinned: false
  },
  {
    id: 7,
    category: '이벤트',
    title: '디보 블록 우수 활용 사례 공모전',
    content: `디보 블록을 활용한 우수 사례를 모집합니다!

공모 기간: 2026년 3월 15일 ~ 4월 15일
시상 내역:
- 대상 1팀: 상금 100만원 + 프리미엄 1년 구독
- 최우수상 2팀: 상금 50만원
- 우수상 5팀: 프리미엄 6개월 구독

참여 방법: 제작한 페이지 URL과 간단한 소개글을 이메일로 제출

많은 참여 바랍니다!`,
    author: '운영팀',
    date: '2026-03-15',
    views: 445,
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    tags: ['이벤트', '공모전', '시상'],
    pinned: false
  },
  {
    id: 8,
    category: '질문',
    title: 'API 연동 시 copy_config_id는 어디서 확인하나요?',
    content: `디보 백오피스에서 코드 복사 시 copy_config_id가 자동 교체된다고 하는데

실제로 어떻게 동작하는 건지 궁금합니다.

로컬에서 테스트할 때는 LOCAL_DATA를 사용하면 된다는 건 알겠는데,
실제 배포 후에는 어떤 흐름으로 데이터가 연결되는 건가요?

문서나 가이드 링크라도 알려주시면 감사하겠습니다.`,
    author: '박지민',
    date: '2026-03-20',
    views: 134,
    thumbnail: '',
    tags: ['질문', 'API', '연동'],
    pinned: false
  },
  {
    id: 9,
    category: '일반',
    title: '히어로 스플릿 섹션으로 브랜드 랜딩페이지 제작 가이드',
    content: `히어로 스플릿 블록을 사용해서 브랜드 랜딩페이지를 빠르게 만드는 방법을 정리했습니다.

Step 1. LOCAL_DATA 설정
각 슬라이드의 main_img_url, title, content, link를 채워주세요.

Step 2. 색상 커스터마이징
:root 변수에서 --blue 값을 브랜드 컬러로 교체하세요.

Step 3. 통계 수치 수정
.hero-stats 부분의 수치를 실제 브랜드 데이터로 교체하세요.

Step 4. 폰트 변경
Google Fonts 링크를 원하는 폰트로 교체하면 완성입니다.

총 작업 시간: 약 30분이면 충분합니다!`,
    author: '최민준',
    date: '2026-03-10',
    views: 312,
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    tags: ['가이드', '히어로', '랜딩페이지'],
    pinned: false
  },
  {
    id: 10,
    category: '일반',
    title: '3D 캐러셀 성능 최적화 방법',
    content: `3D 캐러셀 블록을 사용할 때 모바일에서 버벅임이 있다면 아래 방법을 시도해보세요.

1. 이미지 용량 줄이기
Unsplash 등에서 이미지를 가져올 때 ?w=400&q=70 파라미터로 최적화하세요.

2. will-change 속성 활용
.carousel-3d에 will-change: transform을 추가하면 GPU 가속이 됩니다.

3. 카드 수 제한
카드가 10개 이상이면 성능이 저하됩니다. 7~8개 이하로 유지하세요.

적용 후 테스트해보니 체감 성능이 많이 개선됐습니다.`,
    author: '강다은',
    date: '2026-03-05',
    views: 189,
    thumbnail: '',
    tags: ['팁', '3D캐러셀', '최적화'],
    pinned: false
  }
];
