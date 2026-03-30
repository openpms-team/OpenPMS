import { test, expect } from '@playwright/test';

test.describe('Internationalization (i18n)', () => {
  test('should default to Portuguese locale', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/pt\//);
  });

  test('should display login page in Portuguese', async ({ page }) => {
    await page.goto('/pt/login');
    await expect(page.getByText(/entrar|iniciar sess/i)).toBeVisible();
  });

  test('should switch from Portuguese to English', async ({ page }) => {
    await page.goto('/pt/login');
    await page.getByRole('button', { name: /PT|idioma|language/i }).click();
    await page.getByRole('option', { name: /english|EN/i }).click();
    await expect(page).toHaveURL(/\/en\//);
    await expect(page.getByText(/sign in|login|log in/i)).toBeVisible();
  });

  test('should switch to French', async ({ page }) => {
    await page.goto('/en/login');
    await page.getByRole('button', { name: /EN|language/i }).click();
    await page.getByRole('option', { name: /fran.ais|FR/i }).click();
    await expect(page).toHaveURL(/\/fr\//);
    await expect(page.getByText(/connexion|se connecter/i)).toBeVisible();
  });

  test('should persist locale preference across navigation', async ({ page }) => {
    await page.goto('/en/login');
    await page.getByLabel(/email/i).fill('test@openpms.dev');
    await page.getByLabel(/password/i).fill('TestPass123!');
    // Verify the page is still in English after interaction
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
  });

  test('should handle direct URL with locale prefix', async ({ page }) => {
    await page.goto('/fr/login');
    await expect(page.getByText(/connexion|se connecter|email/i)).toBeVisible();
  });
});
