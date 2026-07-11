import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('language switching exposes a timed, layout-stable transition', async () => {
  const [context, layout, css] = await Promise.all([
    read('src/i18n/LanguageContext.jsx'),
    read('src/components/Layout.jsx'),
    read('src/components/layout.css'),
  ])

  assert.match(context, /isLanguageTransitioning/)
  assert.match(context, /setTimeout\([\s\S]*?180/)
  assert.match(context, /clearTimeout/)
  assert.match(layout, /is-language-transitioning/)
  assert.match(context, /language-switcher-indicator/)
  assert.match(css, /\.language-switcher-indicator/)
  assert.match(css, /body\[data-language="en"\][\s\S]*?language-switcher-indicator/)
})

test('mobile header and menu have stable controls and closed-state isolation', async () => {
  const css = await read('src/components/layout.css')

  assert.match(css, /--mobile-header-control:\s*44px/)
  assert.match(css, /\.mobile-menu-overlay:not\(\.is-open\)[\s\S]*?visibility:\s*hidden/)
  assert.match(css, /\.mobile-menu-overlay\.is-open[\s\S]*?visibility:\s*visible/)
  assert.match(css, /env\(safe-area-inset-top\)/)
  assert.match(css, /min-height:\s*44px/)
})

test('homepage has an authoritative no-overflow mobile layout', async () => {
  const css = await read('src/styles.css')

  assert.match(css, /MOBILE HOME — AUTHORITATIVE LAYOUT/)
  assert.match(css, /@media \(max-width:\s*820px\)/)
  assert.match(css, /\.sales3-home[\s\S]*?overflow:\s*clip/)
  assert.match(css, /\.sales3-hero-grid[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/)
  assert.match(css, /\.sales3-system-window[\s\S]*?transform:\s*none/)
  assert.match(css, /\.sales3-journey-sticky[\s\S]*?position:\s*static/)
  assert.match(css, /\.sales3-services-layout[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/)
  assert.match(css, /@media \(max-width:\s*460px\)/)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
})
