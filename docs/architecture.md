# 🏢 시스템 아키텍처 및 폴더 구조 (v1.5)

본 문서는 `뇌사료` 프로젝트의 물리적 파일 구조와 논리적 설계 아키텍처를 상세히 기술합니다.

## 📁 1. 폴더 구조 (Folder Structure)

| 경로 | 역할 | 상세 설명 |
| :--- | :--- | :--- |
| `/app` | **Backend Core** | Flask 애플리케이션의 핵심 로직 및 라우트 |
| `/app/routes` | **Modular Routes** | 기능별로 분리된 API 엔드포인트 패키지 |
| `/data` | **Database Box** | SQLite3 DB 파일 (`memos.db`) 저장 위치 |
| `/docs` | **Documentation** | 시스템 기술 문서 및 가이드 |
| `/logs` | **Log Box** | 시스템 작동 및 접근 로그 (`app.log`) |
| `/static` | **Static Assets** | CSS, 이미지 및 프론트엔드 리소스 |
| `/static/js/components` | **UI Components** | D3.js 시각화 모듈 및 UI 핵심 로직 |
| `/templates` | **HTML Templates** | Jinja2 기반 레이아웃 및 페이지 |

---

## 🏗️ 2. 설계 아키텍처 (Design Architecture)

### 2.1 Backend: Blueprint-based Modular Flask
- **패키지 구조**: `app/__init__.py`에서 중앙 집중식으로 앱을 생성하고, `routes/` 아래의 각 기능을 Blueprint로 등록합니다.
- **다국어 엔진 (v1.5)**: 서버 사이드에서도 `i18n.py`를 통해 클라이언트 언어 환경에 맞춤화된 응답(에러 메시지 등)을 제공합니다.

### 2.2 Frontend: State-Driven UI
- **컴포넌트 중심 설계**: `HeatmapManager.js`, `CalendarManager.js`, `ComposerCategoryUI.js` 등으로 독립된 모듈 구조를 채택했습니다.
- **State Management**: `AppService.js`를 통해 전역 상태를 관리하며, 설정 변경(언어, 테마) 시 `ThemeManager.js`가 시스템 전반의 정합성을 동기화합니다.

### 2.3 Data Policy: English Constant Policy (v1.5 정책)
- **데이터 정합성**: 다국어 환경에서 그룹 필터링 등이 오작동하는 것을 방지하기 위해, 데이터베이스의 `group_name` 필드에는 **영문 상수**(`default`, `files`, `done` 등)를 저장하는 것을 원칙으로 합니다.
- **매핑 방식**: 화면에 노출되는 텍스트는 프론트엔드 i18n 매니저를 통해 사용자의 현재 언어 설정에 맞춰 동적으로 번역되어 표기됩니다.

### 2.4 Ops & Reliability
- **Surgical Cleanup**: 배포 시 운영 데이터(DB, Uploads)는 보존하고 코드 영역만 정밀하게 교체하는 방식을 채택했습니다.
- **Disaster Recovery**: `backup.py`를 통해 핵심 자산(.env, DB, Uploads)을 증분 백업하여 언제든 즉시 복구가 가능합니다.
