# 매뉴얼 생성 도구 (건축공사 상주감리 대가 산출기)

| 파일 | 하는 일 |
|---|---|
| `build.sh <repo> <raw>` | 캡처 → WebP → HTML → PDF → 검증을 한 번에 |
| `capture_sup.js` | 앱 화면 24장 캡처, 번호 표시점(`_marks.json`) · 예제 값(`_example.json`) 기록 (1440×900, 배율 1.25, 날짜 고정 2026-10-11) |
| `serve.js` | 로컬 서버 + CDN(html2canvas · 글꼴)을 로컬 사본으로 대체 |
| `gen_manual_sup.py` · `manual_engine.py` | 매뉴얼 본문 → `manual/index.html` (예제 수치는 `_example.json`에서 읽음) |
| `pdf_sup.js` | A4 PDF |
| `verify_sup_calc.js` | 금액 계산(mmPct) ↔ 정확 계산(BigInt) 17,325,231건 전수 대조 |
| `verify_manual.py` | 그림·표시점·범례 수, 예제 수치, 내부 링크, 앱 화면 근거 표기 검사 |

환경 변수: `MM_PW`(playwright 모듈 경로) · `MM_VENDOR`(CDN 로컬 사본 폴더) · `MANUAL_DIR`(생성 대상 manual 폴더)

법령·고시나 노임단가가 바뀌면 ① 앱 `index.html`의 단가(`RATES`)와 근거 표기를 고치고 ② `gen_manual_sup.py`의 시행일·조문 표·단가 표(`RATES`)를 고친 뒤 ③ `build.sh`를 다시 돌린다.
