// 공개 개인정보처리방침·이용약관 생성 대본
//
// 정본 = 앱 저장소(kids-english-app)의 세 파일. 이 저장소의 HTML 은 그 글자를 그대로 옮긴 «결과물»이다.
//   src/content/privacy-v1.ts  — 방침 본문(POLICY · POLICY_TITLE · POLICY_LEAD · POLICY_MAIL)
//   src/content/terms-v1.ts    — 약관 본문(TERMS · TERMS_TITLE · TERMS_LEAD)
//   src/constants/policy.ts    — 시행일(POLICY_VERSION)
// HTML 을 손으로 고치지 않는다. 글을 바꾸려면 앱 정본을 고치고 이 대본을 다시 돌린다.
//
// 쓰는 법
//   node tools/build.mjs [--app <앱 저장소 경로>] [--ref <git ref>]          → index.html · terms.html 을 새로 쓴다
//   node tools/build.mjs --check [--app …] [--ref …]                        → 새로 만든 결과와 지금 파일이 한 글자라도 다르면 exit 1
// 기본값 = --app ../kids-english-app · --ref origin/main(앱 체크아웃의 작업 상태가 아니라 그 ref 의 글자를 읽는다)

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const CHECK = args.includes('--check');
const APP = path.resolve(ROOT, opt('--app', '../kids-english-app'));
const REF = opt('--ref', 'origin/main');

const git = (...a) => execFileSync('git', ['-C', APP, ...a], { encoding: 'utf8' });
const SHA = git('rev-parse', '--short=9', REF).trim();
const show = (p) => git('show', `${REF}:${p}`);

// 앱의 typescript 로 TS → CJS 로 옮겨 값을 꺼낸다(타입만 지우고 글자는 손대지 않는다).
const ts = createRequire(path.join(APP, 'package.json'))('typescript');
const FILES = {
  'constants/policy': 'src/constants/policy.ts',
  'content/privacy-v1': 'src/content/privacy-v1.ts',
  'content/terms-v1': 'src/content/terms-v1.ts',
};
const cache = {};
function load(key) {
  if (cache[key]) return cache[key];
  const src = show(FILES[key]);
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mod = { exports: {} };
  cache[key] = mod.exports;
  const req = (spec) => {
    const k = Object.keys(FILES).find((f) => spec.endsWith(f) || spec.endsWith(f.split('/')[1]));
    if (!k) throw new Error(`정본 밖 import: ${spec} (${FILES[key]})`);
    return load(k);
  };
  new Function('exports', 'require', 'module', js)(mod.exports, req, mod);
  cache[key] = mod.exports;
  return mod.exports;
}

const { POLICY_VERSION } = load('constants/policy');
const { POLICY, POLICY_TITLE, POLICY_LEAD } = load('content/privacy-v1');
const { TERMS, TERMS_TITLE, TERMS_LEAD } = load('content/terms-v1');
if (!POLICY_VERSION || !Array.isArray(POLICY) || !Array.isArray(TERMS)) throw new Error('정본 값을 못 읽었다');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 블록 → HTML. 앱 화면(src/app/privacy.tsx · terms.tsx)이 그리는 갈래와 같다:
//   p 문단 · li 목록 한 줄(뒤따르는 sub 는 그 줄 안에 들여 쓴다) · th/row 표 · mail 문의처
function blocksHtml(blocks) {
  const out = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.k === 'p') { out.push(`<p>${esc(b.t)}</p>`); i++; continue; }
    if (b.k === 'mail') { out.push(`<p class="mail">${esc(b.t)}</p>`); i++; continue; }
    if (b.k === 'th' || b.k === 'row') {
      const rows = [];
      while (i < blocks.length && (blocks[i].k === 'th' || blocks[i].k === 'row')) {
        const r = blocks[i], tag = r.k === 'th' ? 'th' : 'td';
        rows.push(`<tr><${tag}>${esc(r.a)}</${tag}><${tag}>${esc(r.b)}</${tag}></tr>`);
        i++;
      }
      out.push(`<div class="tbl"><table>\n${rows.join('\n')}\n</table></div>`);
      continue;
    }
    if (b.k === 'li' || b.k === 'sub') {
      const items = [];
      while (i < blocks.length && (blocks[i].k === 'li' || blocks[i].k === 'sub')) {
        const r = blocks[i];
        const line = `${r.emoji ? esc(r.emoji) + ' ' : ''}${esc(r.t)}`;
        if (r.k === 'li' || !items.length) items.push({ t: line, subs: [] });
        else items[items.length - 1].subs.push(line);
        i++;
      }
      out.push('<ul>\n' + items.map((it) => `<li>${it.t}${it.subs.map((s) => `<p class="sub">${s}</p>`).join('')}</li>`).join('\n') + '\n</ul>');
      continue;
    }
    throw new Error(`모르는 갈래: ${b.k}`);
  }
  return out.join('\n');
}

const STYLE = `body{margin:0;background:#fff;color:#222;font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif;font-size:16px;line-height:1.7;word-break:keep-all;overflow-wrap:anywhere}
main{max-width:40rem;margin:0 auto;padding:1.25rem 1rem 3rem}
nav{font-size:.9rem;margin:.25rem 0 1rem}nav a{color:#1a5fb4}
h1{font-size:1.5rem;margin:.5rem 0}h2{font-size:1.1rem;margin:2rem 0 .5rem}
.tbl{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:.95rem}th,td{border:1px solid #ddd;padding:.4rem .5rem;text-align:left;vertical-align:top}th{background:#f5f5f5}
ul{padding-left:1.25rem}li{margin:.25rem 0}.sub{margin:.25rem 0 0;color:#444}
.mail{user-select:all}`;

function page({ title, lead, sections, other }) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>하이빵용 ${esc(title)}</title>
<!-- 생성물 · 손으로 고치지 말 것 · 정본 = kids-english-app src/content/*.ts · 시행일 ${esc(POLICY_VERSION)} · node tools/build.mjs -->
<style>
${STYLE}
</style>
</head>
<body>
<main>
<h1>${esc(title)}</h1>
<nav><a href="${other.href}">${esc(other.label)}</a></nav>
<p>${esc(lead)}</p>
${sections.map((s) => `<h2>${esc(`${s.n}. ${s.head}`)}</h2>\n${blocksHtml(s.blocks)}`).join('\n')}
</main>
</body>
</html>
`;
}

const outputs = {
  'index.html': page({ title: POLICY_TITLE, lead: POLICY_LEAD, sections: POLICY, other: { href: 'terms.html', label: '이용약관 보기' } }),
  'terms.html': page({ title: TERMS_TITLE, lead: TERMS_LEAD, sections: TERMS, other: { href: './', label: '개인정보처리방침 보기' } }),
};

// 글자 대조 — 정본의 모든 글자열이 결과 HTML 안에 (이스케이프된 채) 그대로 들어 있어야 한다.
function strings(sections) {
  const s = [];
  for (const sec of sections) { s.push(sec.head); for (const b of sec.blocks) for (const k of ['t', 'a', 'b']) if (b[k] != null) s.push(b[k]); }
  return s;
}
const want = { 'index.html': [POLICY_TITLE, POLICY_LEAD, ...strings(POLICY)], 'terms.html': [TERMS_TITLE, TERMS_LEAD, ...strings(TERMS)] };
for (const [f, list] of Object.entries(want)) {
  const miss = list.filter((t) => !outputs[f].includes(esc(t)));
  if (miss.length) throw new Error(`${f} 에 정본 글자 ${miss.length}줄이 없다: ${miss[0]}`);
}
// 내부 표식이 새면 안 된다(옛 공개본의 «[정식 출시 전 법무 검토 · R2]» 류).
for (const [f, html] of Object.entries(outputs)) if (html.includes('법무 검토')) throw new Error(`${f} 에 내부 표식`);

let bad = 0;
for (const [f, html] of Object.entries(outputs)) {
  const p = path.join(ROOT, f);
  if (CHECK) {
    // 윈도 체크아웃은 CRLF 로 풀릴 수 있다(core.autocrlf) — 줄바꿈만 맞추고 글자는 그대로 댄다.
    const cur = existsSync(p) ? readFileSync(p, 'utf8').replace(/\r\n/g, '\n') : '';
    if (cur !== html) { console.log(`✗ ${f} — 정본(${SHA})으로 새로 만든 것과 다르다`); bad++; }
    else console.log(`✓ ${f} — 정본 ${SHA} 과 한 글자도 안 다르다`);
  } else {
    writeFileSync(p, html);
    console.log(`wrote ${f} ← kids-english-app ${SHA} · 시행일 ${POLICY_VERSION}`);
  }
}
process.exit(bad ? 1 : 0);
