const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  // Evita depender de Google Fonts en CI
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto('/');
});

test('carga con título y secciones principales', async ({ page }) => {
  await expect(page).toHaveTitle(/Lustre Prestige/);
  for (const id of ['inicio', 'servicios', 'nosotros', 'clientes', 'contacto']) {
    await expect(page.locator('#' + id)).toBeAttached();
  }
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('no tiene scroll horizontal', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});

test('muestra los tres servicios', async ({ page }) => {
  await expect(page.locator('.svc')).toHaveCount(3);
});

test('el comparador antes/después actualiza la posición', async ({ page }) => {
  const slider = page.locator('#compare input[type=range]');
  await slider.fill('80');
  await expect(page.locator('#compare')).toHaveAttribute('style', /--p:\s*80%/);
});

test('el carrusel de testimonios cambia al elegir otro', async ({ page }) => {
  const dots = page.locator('#dots button');
  await expect(dots).toHaveCount(3);
  const first = await page.locator('#q-text').textContent();
  await dots.nth(1).click();
  await expect(page.locator('#q-text')).not.toHaveText(first);
  await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
});

test('el contador de "años de experiencia" llega a 12', async ({ page }) => {
  const el = page.locator('[data-count="12"]');
  await el.scrollIntoViewIfNeeded();
  await expect(el).toHaveText('12');
});

test.describe('formulario de contacto', () => {
  test('muestra errores si se envía vacío', async ({ page }) => {
    await page.locator('#contacto').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Enviar solicitud' }).click();
    await expect(page.locator('#form .err:not(:empty)')).toHaveCount(4);
    await expect(page.locator('#ok')).not.toHaveClass(/show/);
  });

  test('rechaza un correo inválido', async ({ page }) => {
    await page.fill('input[name=nombre]', 'Ana Pérez');
    await page.fill('input[name=tel]', '809 555 0123');
    await page.fill('input[name=email]', 'no-es-correo');
    await page.fill('input[name=auto]', 'BMW M4');
    await page.getByRole('button', { name: 'Enviar solicitud' }).click();
    await expect(page.locator('input[name=email]')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#ok')).not.toHaveClass(/show/);
  });

  test('confirma el envío con datos válidos y limpia el formulario', async ({ page }) => {
    await page.fill('input[name=nombre]', 'Ana Pérez');
    await page.fill('input[name=tel]', '809 555 0123');
    await page.fill('input[name=email]', 'ana@example.com');
    await page.fill('input[name=auto]', 'Porsche 911');
    await page.getByRole('button', { name: 'Enviar solicitud' }).click();
    await expect(page.locator('#ok')).toHaveClass(/show/);
    await expect(page.locator('input[name=nombre]')).toHaveValue('');
  });
});

test('menú móvil: abre, cierra al navegar y actualiza aria-expanded', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Solo aplica en móvil');
  const btn = page.locator('.menu');
  const menu = page.locator('#menu');
  await expect(btn).toBeVisible();
  await expect(menu).toBeHidden();
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toBeVisible();
  await menu.getByRole('link', { name: 'Nosotros' }).click();
  await expect(menu).toBeHidden();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
});

test('escritorio: el menú es visible y el botón hamburguesa no', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Solo aplica en escritorio');
  await expect(page.locator('.menu')).toBeHidden();
  await expect(page.locator('#menu')).toBeVisible();
});
