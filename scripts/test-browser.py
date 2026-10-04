"""Run against a built Wrangler server, or set SITE_URL to production."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

base = os.environ.get('SITE_URL', 'http://localhost:8787')
output = Path('.wrangler/qa')
output.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(base, wait_until='networkidle')
    expect(page.locator('.result-row')).to_have_count(4)
    page.screenshot(path=str(output / 'desktop.png'), full_page=True)
    page.locator('#amount').fill('2000')
    expect(page.locator('.result-summary__main')).to_contain_text('2.000')
    expect(page.locator('.result-row')).to_have_count(4)
    page.get_by_text('Hesabın adımları ve kullanılan değerler', exact=True).click()
    expect(page.locator('.calculation-step')).to_have_count(4)
    page.get_by_role('button', name='Koyu temaya geç').click()
    expect(page.locator('html')).to_have_attribute('data-theme', 'dark')
    page.screenshot(path=str(output / 'dark.png'), full_page=True)
    page.get_by_role('button', name='Açık temaya geç').click()
    page.goto(base + '/#amount=1000&unit=try&start=2000-01&end=2024-01&criteria=cpi', wait_until='networkidle')
    expect(page.get_by_role('alert')).to_contain_text('veri yok')
    expect(page.locator('.result-row')).to_have_count(0)
    page.goto(base + '/atlas/2010daki-1000-tl-bugun-ne-anlatiyor', wait_until='networkidle')
    expected_end = page.locator('.publisher-cta').get_attribute('href')
    assert '&end=' in expected_end
    page.locator('.publisher-cta').click()
    page.wait_for_load_state('networkidle')
    expect(page.locator('.result-row')).to_have_count(5)
    for width in [390, 320]:
        page.set_viewport_size({'width': width, 'height': 844})
        for path in ['/', '/rehberler/tufe-ile-para-degeri-nasil-hesaplanir', '/veri-kaynaklari', '/veri-durumu']:
            page.goto(base + path, wait_until='networkidle')
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), f'Overflow: {width} {path}'
            assert page.locator('h1').count() == 1
        page.goto(base, wait_until='networkidle')
        page.screenshot(path=str(output / f'mobile-{width}.png'), full_page=True)
    nojs = browser.new_context(java_script_enabled=False)
    static = nojs.new_page()
    static.goto(base + '/iletisim')
    expect(static.get_by_role('link', name='egemenyildiz03@gmail.com')).to_be_visible()
    static.goto(base + '/atlas/2010daki-1000-tl-bugun-ne-anlatiyor')
    expect(static.get_by_role('table', name='Örnek hesaplama sonuçları')).to_be_visible()
    assert not errors, errors
    browser.close()
print('Browser checks passed: calculation, error recovery, example link, theme, 320/390px layout, no-JS content and no runtime errors.')
