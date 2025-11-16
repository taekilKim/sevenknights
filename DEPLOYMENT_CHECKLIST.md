# 배포 후 체크리스트

## ✅ 즉시 확인 (배포 후 5분 이내)

### 1. Sitemap 확인
- [ ] https://senadb.games/sitemap.xml 접속
- [ ] 모든 URL이 `https://`로 시작하는지 확인
- [ ] 영웅 페이지들이 모두 포함되어 있는지 확인
- [ ] beginner-guide.html이 포함되어 있는지 확인

### 2. 초보자 가이드 페이지 확인
- [ ] https://senadb.games/beginner-guide.html 접속
- [ ] 페이지가 정상적으로 로드되는지 확인
- [ ] 모바일에서도 정상 작동하는지 확인 (Chrome 개발자 도구 모바일 뷰)
- [ ] 모든 섹션이 정상적으로 표시되는지 확인

### 3. 영웅 페이지 확인 (아무 영웅 1개)
- [ ] 임의의 영웅 페이지 접속 (예: https://senadb.games/hero.html?name=델론)
- [ ] 상단에 Breadcrumb이 표시되는지 확인 (홈 > 영웅 도감 > 델론)
- [ ] "가이드" 탭이 추가되었는지 확인
- [ ] "가이드" 탭 클릭하여 내용이 표시되는지 확인
- [ ] 하단에 "관련 영웅 더보기" 섹션이 있는지 확인
- [ ] 관련 영웅 카드를 클릭하면 해당 영웅 페이지로 이동하는지 확인

### 4. 홈페이지 메타 태그 확인
- [ ] https://senadb.games 접속
- [ ] 브라우저 탭 제목이 "세나DB | 세븐나이츠 리버스 도감 & 공략 - 영웅 장비 빌드 가이드"인지 확인
- [ ] 페이지 소스 보기 (Ctrl+U 또는 Cmd+U)
- [ ] `<meta name="description">`에 "완벽 공략", "추천 장비" 등이 포함되어 있는지 확인

---

## 📊 Google Search Console 설정 (배포 후 1시간 이내)

### 1. Sitemap 제출
1. [Google Search Console](https://search.google.com/search-console) 접속
2. senadb.games 속성 선택
3. 왼쪽 메뉴 "색인 생성" > "Sitemaps" 클릭
4. 새 sitemap 추가: `https://senadb.games/sitemap.xml`
5. 제출 버튼 클릭
6. 상태가 "성공"으로 표시되는지 확인 (몇 분 소요)

### 2. URL 검사 (새 페이지 색인 요청)
초보자 가이드 페이지를 빠르게 색인하려면:
1. 상단 검색창에 `https://senadb.games/beginner-guide.html` 입력
2. "색인 생성 요청" 버튼 클릭
3. 1-2분 대기 후 색인 요청 완료

---

## 🔍 SEO 테스트 (배포 후 24시간 이내)

### 1. Google Rich Results Test
- URL: https://search.google.com/test/rich-results
- 테스트할 페이지:
  - [ ] https://senadb.games/ (WebSite 스키마)
  - [ ] https://senadb.games/beginner-guide.html (HowTo 스키마)
  - [ ] https://senadb.games/faq.html (FAQPage 스키마)
- 모든 구조화 데이터가 오류 없이 인식되는지 확인

### 2. Google PageSpeed Insights
- URL: https://pagespeed.web.dev/
- 테스트할 페이지:
  - [ ] https://senadb.games/
  - [ ] https://senadb.games/beginner-guide.html
  - [ ] 임의의 영웅 페이지
- 목표:
  - 모바일 점수 70점 이상
  - 데스크톱 점수 90점 이상

### 3. Mobile-Friendly Test
- URL: https://search.google.com/test/mobile-friendly
- 테스트할 페이지:
  - [ ] https://senadb.games/
  - [ ] https://senadb.games/beginner-guide.html
- "페이지가 모바일 친화적입니다" 메시지 확인

---

## 📈 모니터링 (배포 후 1주일)

### Google Search Console 모니터링
- [ ] "실적" 탭에서 클릭 수 증가 추이 확인
- [ ] "색인 생성" > "페이지"에서 색인된 페이지 수 확인
  - 목표: 95개 이상 (영웅 페이지 + 가이드 페이지들)
- [ ] "검색어" 탭에서 새로운 키워드 유입 확인
  - 기대: "세나 리버스 초보자", "세나 리버스 장비" 등

### Google Analytics (설치되어 있다면)
- [ ] 페이지뷰 증가 확인
- [ ] 평균 체류 시간 확인 (목표: 2분 이상)
- [ ] 이탈률 확인 (목표: 60% 이하)
- [ ] 새 페이지 유입 확인 (beginner-guide.html)

---

## ⚠️ 문제 발생 시 대응

### Sitemap 오류
**증상:** sitemap.xml 접속 시 404 또는 오류
**해결:**
```bash
# Vercel 배포 로그 확인
vercel logs --follow
# server.js가 정상적으로 배포되었는지 확인
```

### 페이지 404 오류
**증상:** beginner-guide.html 접속 시 404
**해결:**
- Vercel 대시보드에서 배포 상태 확인
- `public/beginner-guide.html` 파일이 제대로 배포되었는지 확인

### 메타 태그 미반영
**증상:** 브라우저 탭 제목이 변경되지 않음
**해결:**
- 브라우저 캐시 삭제 (Ctrl+Shift+R 또는 Cmd+Shift+R)
- 시크릿 모드로 접속하여 재확인

---

## 🎯 성공 지표 (3개월 후)

| 지표 | 현재 | 1개월 후 목표 | 3개월 후 목표 |
|------|------|--------------|--------------|
| 색인된 페이지 | ~45개 | 80개 이상 | 95개 이상 |
| 월간 검색 유입 | ? | 500명 이상 | 1,000명 이상 |
| 평균 체류 시간 | ? | 1분 30초 이상 | 2분 이상 |
| 이탈률 | ? | 65% 이하 | 60% 이하 |

---

## 📝 다음 개선 작업 (선택사항)

### 단기 (1-2주)
- [ ] 주요 영웅 5개의 가이드 탭 데이터 실제 작성
- [ ] 초보자 가이드에 스크린샷 추가
- [ ] 영웅 페이지 alt 태그 최적화

### 중기 (1개월)
- [ ] 영웅 비교 페이지 생성
- [ ] 주간 메타 리포트 작성
- [ ] 내부 링크 더 강화 (영웅 간 시너지 정보)

### 장기 (3개월)
- [ ] 커뮤니티 기능 (사용자 빌드 공유)
- [ ] 패치 노트 아카이브
- [ ] 동영상 가이드 임베드
