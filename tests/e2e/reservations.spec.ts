import { test, expect } from '@playwright/test';

test.describe('Reservations', () => {
  test.skip('should display reservations list', async ({ page }) => {
    // Requires authenticated session
    await page.goto('/reservations');
    await expect(page.getByRole('heading', { name: /reservas|reservations/i })).toBeVisible();
  });

  test.skip('should create a new reservation', async ({ page }) => {
    // Requires authenticated session and at least one property
    await page.goto('/reservations');
    await page.getByRole('button', { name: /nova|new|adicionar|add/i }).click();
    await page.getByLabel(/propriedade|property/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/check.?in/i).fill('2026-04-15');
    await page.getByLabel(/check.?out/i).fill('2026-04-20');
    await page.getByLabel(/nome.*h.spede|guest.*name/i).fill('Maria Silva');
    await page.getByLabel(/email/i).fill('maria@example.com');
    await page.getByLabel(/valor|price|total/i).fill('500');
    await page.getByRole('button', { name: /guardar|save|criar|create/i }).click();
    await expect(page.getByText('Maria Silva')).toBeVisible({ timeout: 5000 });
  });

  test.skip('should change reservation status', async ({ page }) => {
    // Requires seeded reservation in database
    await page.goto('/reservations');
    await page.getByText('Maria Silva').click();
    await page.getByRole('button', { name: /estado|status/i }).click();
    await page.getByRole('option', { name: /confirmad|confirmed/i }).click();
    await expect(page.getByText(/confirmad|confirmed/i)).toBeVisible({ timeout: 5000 });
  });

  test.skip('should filter reservations by status', async ({ page }) => {
    // Requires multiple seeded reservations with different statuses
    await page.goto('/reservations');
    await page.getByRole('combobox', { name: /filtrar|filter|estado|status/i }).click();
    await page.getByRole('option', { name: /confirmad|confirmed/i }).click();
    const rows = page.getByRole('row');
    await expect(rows).not.toHaveCount(0);
  });

  test.skip('should show reservation on calendar view', async ({ page }) => {
    // Requires seeded reservation in the current month
    await page.goto('/calendar');
    await expect(page.getByText('Maria Silva')).toBeVisible();
  });
});
