# hibbangyong-privacy

하이빵용 개인정보처리방침(`index.html`) · 이용약관(`terms.html`) 공개 페이지.

- 정본 = 앱 저장소 `kids-english-app` 의 `src/content/privacy-v1.ts` · `src/content/terms-v1.ts` · `src/constants/policy.ts`(시행일).
- 두 HTML 은 생성물이다. 손으로 고치지 않는다 — 앱 정본을 고친 뒤 다시 만든다.

```
node tools/build.mjs                 # ../kids-english-app 의 origin/main 글자로 index.html · terms.html 을 새로 쓴다
node tools/build.mjs --check         # 지금 파일이 정본과 한 글자라도 다르면 exit 1
node tools/build.mjs --app <경로> --ref <git ref>
```

게시 = `gh-pages` 가지(GitHub Pages).
