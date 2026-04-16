# 📡 데이터베이스 및 API 명세서 (v1.5)

본 문서는 `뇌사료` 프로젝트의 데이터 저장 구조(Schema)와 모든 외부 통신 인터페이스(API)를 상세히 기술합니다.

## 🗄️ 1. 데이터베이스 스키마 (DB Schema)

### 1.1 `memos` 테이블
메모의 핵심 데이터를 저장합니다.
| 컬럼명 | 타입 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY | 자동 증가 고유 아이디 |
| `title` | TEXT | - | 메모 제목 |
| `content` | TEXT | - | 메모 본문 (마크다운) |
| `summary` | TEXT | - | AI 생성 요약문 |
| `color` | TEXT | `#2c3e50` | 메모 카드 테마 색상 |
| `is_pinned` | BOOLEAN | 0 | 상단 고정 여부 |
| `status` | TEXT | `'active'` | 상태 (`active`, `done`, `archived`) |
| `group_name` | TEXT | `'default'` | 그룹 ID (영문 상수 권장) |
| `category` | TEXT | - | (v1.5) 소속 카테고리 명 |
| `is_encrypted` | BOOLEAN | 0 | 암호화 여부 |
| `created_at` | TIMESTAMP | - | 생성 일시 |
| `updated_at` | TIMESTAMP | - | 수정 일시 |

### 1.2 `tags` 테이블
메모와 태그 간의 관계를 저장합니다.
| 컬럼명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `memo_id` | INTEGER | 소속 메모 ID |
| `name` | TEXT | 태그 이름 |
| `source` | TEXT | 생성 주체 (`user`, `ai`) |

### 1.3 `attachments` 테이블
메모에 첨부된 미디어 자산을 관리합니다.
| 컬럼명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `memo_id` | INTEGER | 소속 메모 ID |
| `filename` | TEXT | 저장된 파일명 (UUID 기반) |
| `original_name`| TEXT | 원본 파일명 |
| `file_type` | TEXT | MIME 타입 |
| `size` | INTEGER | 파일 크기 (Bytes) |

### 1.4 `memo_links` 테이블
메모 간의 `[[#ID]]` 링크 및 시각화 인력을 관리합니다.
| 컬럼명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `source_id` | INTEGER | 링크를 건 메모 ID |
| `target_id` | INTEGER | 링크 대상 메모 ID |

---

## 🌐 2. API 엔드포인트 명세 (주요 항목)

### 2.1 Memos & Search
- `GET /api/memos`: 필터링된 메모 목록 및 메타데이터 통합 조회.
- `POST /api/memos/<id>/decrypt`: 암호화된 메모 복호화 요청.
- `GET /api/stats/heatmap`: 히트맵 렌더링을 위한 통계 데이터 조회.

### 2.2 Settings & Configuration (v1.5 업데이트)
| Method | URL | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/settings` | - | 테마, 언어, 고급 기능 활성화 상태 조회 |
| `POST` | `/api/settings` | `lang`, `enable_categories`, `bg_color` 등 | 서버 설정을 영구 업데이트 |

> **v1.5 변경점**: `lang`(언어), `enable_categories`(고급 카테고리 사용 여부) 필드가 추가되었습니다.
