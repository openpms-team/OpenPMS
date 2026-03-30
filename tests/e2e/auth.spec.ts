import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page with email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar|login|sign in/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /entrar|login|sign in/i }).click();
    await expect(page.getByText(/invalid|incorret|erro/i)).toBeVisible({ timeout: 5000 });
  });

  test.skip('should login successfully with valid credentials', async ({ page }) => {
    // Requires seeded test user in Supabase: test@openpms.dev / TestPass123!
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@openpms.dev');
    await page.getByLabel(/password/i).fill('TestPass123!');
    await page.getByRole('button', { name: /entrar|login|sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test.skip('should logout and redirect to login page', async ({ page }) => {
    // Requires authenticated session
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /menu|perfil|profile/i }).click();
    await page.getByRole('menuitem', { name: /sair|logout/i }).click();
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });
});
