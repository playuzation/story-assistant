# story-assistant

소설·연극 같은 이야기를 만들 때 등장 인물, 사건, 배경, 물건의 설정과 관계를 정리하는 웹 서비스입니다.
GitHub Pages로 배포되며 PC와 모바일 브라우저에서 모두 사용할 수 있습니다.

- 배포 주소: https://playuzation.github.io/story-assistant/ (`main` 브랜치에 병합되면 배포)

## 주요 기능

### 설정 페이지 (`#/settings`)
- **인물 / 사건 / 배경 / 물건**을 추가하고, 각각 설명과 자유로운 설정 항목(예: 나이 = 17)을 입력합니다.
- **사건**에는 기간(발생일·종료일), 등장 인물, 배경 전환 순서(예: 왕궁 → 숲)를 지정할 수 있습니다.
- 모든 요소에 이름 붙은 **날짜**(예: 인물의 생일, 배경의 건국일)를 여러 개 추가할 수 있습니다.
  - 날짜는 연/월/일 숫자로 입력하며 월·일은 비워둘 수 있습니다. 음수 연도나 가상 달력의 연도도 입력할 수 있습니다.
- 왼쪽 **폴더 트리**에서 폴더(하위 폴더 포함)를 만들어 요소를 나눠 볼 수 있습니다.
  - 폴더를 선택하면 그 폴더와 하위 폴더의 요소가 표시되고, 종류별 필터도 쓸 수 있습니다.

### 관계도 페이지 (`#/relations`)
- 폴더 안에 여러 **관계도(그래프 보드)**를 만들고, 보드마다 필요한 요소만 올려 작게 나눠 봅니다.
- 노드의 점(●)을 드래그하거나 두 점을 차례로 누르면 관계가 만들어집니다. 관계 이름과 설명도 입력할 수 있습니다.
  - 노드를 선택한 뒤 패널의 "관계 추가"로도 만들 수 있습니다(모바일에서 편리).
- 같은 두 요소 사이에 관계를 여러 개 만들 수 있습니다(방향이 같아도 됨). 겹치지 않도록 곡선을 나눠 그립니다.
- 사건의 등장 인물과 배경 전환은 점선으로 함께 표시됩니다. 편집은 설정 페이지에서 합니다.
- 관계는 보드가 아니라 요소 사이에 저장됩니다. 같은 요소를 여러 보드에 올리면 관계도 함께 보입니다.

### 타임라인 페이지 (`#/timeline`)
- 사건의 기간과 요소의 날짜를 시간순으로 보여줍니다.
- 사건 기간은 시작부터 종료까지 이어지는 막대로 표시합니다. 겹치는 사건은 서로 다른 열에 그립니다.
- 가상 달력도 다룰 수 있도록 실제 시간 간격이 아닌 **순서** 기준으로 배치합니다.
- 설정 페이지의 폴더로 범위를 좁혀 볼 수 있습니다.

### 이야기 저장 / 불러오기
- 작업 내용은 서버 없이 **브라우저(localStorage)** 에 자동 저장됩니다. 다른 기기나 브라우저와는 공유되지 않습니다.
- 상단의 **📖 이야기 버튼**에서 제목·설명을 입력하고, 이야기를 **파일로 저장**하거나 **불러오기**, **새 이야기**를 시작할 수 있습니다.
  - 이야기 하나가 파일 하나(`제목.story.json`)입니다.
  - 불러오거나 새로 시작하면 지금 작업 중인 이야기는 바뀌므로, 필요하면 먼저 저장하세요.
- 불러올 때 형식이 어긋난 값은 기본값으로 채우고, 끊어진 참조(없는 요소를 가리키는 관계 등)는 정리한 뒤 알려 줍니다.

## 이야기 파일 형식 (`.story.json`, schemaVersion 1)

```json
{
  "format": "story-assistant",
  "schemaVersion": 1,
  "savedAt": "2026-10-13T00:00:00.000Z",
  "story": { "title": "제목", "description": "설명" },
  "graph": {
    "nodes": [
      { "id": "…", "kind": "character", "name": "아린", "folderId": "…", "description": "", "attributes": [], "dates": [] },
      { "id": "…", "kind": "event", "name": "추격전", "folderId": null, "description": "", "attributes": [], "dates": [],
        "startDate": { "year": 312, "month": 3, "day": null }, "endDate": { "year": null, "month": null, "day": null },
        "characterIds": ["…"], "placeIds": ["…"] }
    ],
    "edges": [{ "id": "…", "source": "…", "target": "…", "label": "라이벌", "description": "" }]
  },
  "folders": [{ "id": "…", "scope": "settings", "name": "1부", "parentId": null }],
  "views": { "boards": [{ "id": "…", "name": "주인공", "folderId": null, "layout": { "<노드 id>": { "x": 0, "y": 0 } } }] }
}
```

| 영역 | 내용 |
| --- | --- |
| `story` | 이야기 정보 |
| `graph.nodes` | 요소. `kind`는 `character`(인물) / `event`(사건) / `place`(배경) / `item`(물건). 사건 전용 필드(`startDate`, `endDate`, `characterIds`, `placeIds`)는 사건에만 기록 |
| `graph.edges` | 관계(방향 있음). 같은 두 노드 사이에 여러 개 가능 |
| `folders` | 폴더 트리. `scope`는 `settings`(설정 페이지) / `relations`(관계도 페이지) |
| `views.boards` | 관계도와 노드 배치 좌표 |

- 날짜는 `{ year, month, day }` 숫자이며 비어 있으면 `null`입니다. `year`가 `null`이면 날짜 미정입니다.
- 형식이 바뀌면 `schemaVersion`을 올리고, 앱이 이전 버전 파일을 변환해서 불러옵니다. 더 새로운 버전의 파일은 불러오지 않습니다.

## 개발

Node.js 22 이상이 필요합니다.

```bash
npm install
npm run dev      # 개발 서버
npm test         # 단위 테스트 (vitest)
npm run build    # 타입 검사 + 프로덕션 빌드 (dist/)
```

### 모듈 구조

상위 모듈이 하위 모듈만 import하는 단방향 계층이며, 순환 참조를 허용하지 않습니다.

```
src/
├── main.tsx             진입점
├── app/                 앱 셸: 헤더, 해시 라우팅, 이야기 메뉴(저장/불러오기)
├── features/
│   ├── settings/        설정 페이지
│   ├── relations/       관계도 페이지 (React Flow)
│   └── timeline/        타임라인 페이지
├── store/               zustand 상태 + localStorage 영속화
├── shared/ui/           범용 UI (폴더 트리, 사이드바, 상세 패널, 배지)
└── domain/              타입, 순수 함수, 이야기 파일 변환 (다른 모듈을 import하지 않음)
```

```
main → app → features/* → store     → domain
                        → shared/ui → domain
```

- `features/*` 모듈끼리는 서로 import하지 않습니다.
- 다른 모듈은 각 모듈의 `index.ts`를 통해서만 import합니다.

## 브랜치 전략

| 작업 | 브랜치 | 대상 | 병합 방식 |
| --- | --- | --- | --- |
| 코드 수정 | `feat/*` | `dev` | rebase merge |
| 텍스트 파일만 수정 | `docs/*` | `dev` | rebase merge |
| 그 밖의 수정 (설정, CI 등) | `chore/*` | `dev` | rebase merge |
| 배포 | `dev` | `main` | merge (요청 시에만) |

- 작업 브랜치는 항상 `dev`에서 만듭니다.
- `main`에는 `dev`에서 올린 PR만 병합합니다. `main`에 병합되면 GitHub Actions가 GitHub Pages로 배포합니다.
- CI(테스트 + 빌드)는 `dev`/`main` 대상 PR과 `dev` 푸시에서 실행됩니다.
