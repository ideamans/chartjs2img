---
layout: page
title: chartjs2img
aside: false
sidebar: false
---

<div class="c2i-lang-select">
  <h1>chartjs2img</h1>
  <p class="c2i-lang-select__tagline-en">Server-side Chart.js rendering for the AI era</p>
  <p class="c2i-lang-select__tagline-ja">AI 時代のサーバーサイド Chart.js レンダラ</p>
  <div class="c2i-lang-select__btns">
    <a href="/en/" class="c2i-btn">English</a>
    <a href="/ja/" class="c2i-btn">日本語</a>
  </div>
</div>

<style>
.c2i-lang-select {
  min-height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
}
.c2i-lang-select h1 {
  font-size: 3rem;
  font-weight: 700;
  margin: 0;
}
.c2i-lang-select p {
  font-size: 1.25rem;
  opacity: 0.8;
  margin: 0;
}
.c2i-lang-select__tagline-en { margin-top: 4px; }
.c2i-lang-select__tagline-ja { margin-bottom: 32px; }
.c2i-lang-select__btns {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}
.c2i-btn {
  display: inline-block;
  padding: 12px 28px;
  border-radius: 8px;
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s;
}
.c2i-btn:hover {
  background: var(--vp-c-brand-2);
}
</style>
