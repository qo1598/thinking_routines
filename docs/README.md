# 📁 문서 관리 가이드

이 디렉토리는 프로젝트의 개발 관련 문서들을 체계적으로 관리하기 위한 공간입니다.

## 📋 디렉토리 구조

```
docs/
├── README.md                    # 이 파일 (문서 관리 가이드)
├── requirements/               # 기능 개발 요구서
│   ├── template.md            # 요구서 작성 템플릿
│   ├── YYYY-MM-DD_기능명.md   # 개별 요구서 (날짜_기능명 형식)
│   └── completed/             # 완료된 요구서 아카이브
├── development/               # 개발 과정 문서
│   ├── implementation_log.md  # 구현 과정 기록
│   └── testing_results.md     # 테스트 결과 기록
└── architecture/              # 시스템 아키텍처 문서
    ├── database_design.md     # 데이터베이스 설계
    ├── api_specification.md   # API 명세
    └── system_overview.md     # 시스템 전체 구조
```

## 🎯 사용 방법

### 1. 새로운 기능 개발 요청
1. `requirements/template.md` 파일을 복사
2. `requirements/YYYY-MM-DD_기능명.md` 형식으로 파일명 작성
3. 요구사항을 상세히 작성
4. AI에게 검토 요청

### 2. 개발 진행 중
- 구현 과정은 `development/implementation_log.md`에 기록
- 테스트 결과는 `development/testing_results.md`에 기록

### 3. 완료 후
- 완료된 요구서는 `requirements/completed/`로 이동
- 시스템 변경사항이 있으면 `architecture/` 문서 업데이트

## 📝 다음 단계

첫 번째 기능 개발 요구서를 작성하려면:
1. `docs/requirements/template.md` 파일 확인
2. 새로운 요구서 파일 생성
3. 요구사항 작성 후 AI에게 검토 요청