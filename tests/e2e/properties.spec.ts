import { test, expect } from '@playwright/test';

test.describe('Properties CRUD', () => {
  test.skip('should display properties list page', async ({ page }) => {
    // Requires authenticated session with manager role
    await page.goto('/properties');
    await expect(page.getByRole('heading', { name: /propriedades|properties/i })).toBeVisible();
  });

  test.skip('should create a new property', async ({ page }) => {
    // Requires authenticated session with manager role
    await page.goto('/properties');
    await page.getByRole('button', { name: /adicionar|add|nova/i }).click();
    await page.getByLabel(/nome|name/i).fill('Casa da Praia');
    await page.getByLabel(/morada|address/i).fill('Rua do Mar 42, Ericeira');
    await page.getByLabel(/quartos|bedrooms/i).fill('3');
    await page.getByLabel(/capacidade|capacity|guests/i).fill('6');
    await page.getByRole('button', { name: /guardar|save|criar|create/i }).click();
    await expect(page.getByText('Casa da Praia')).toBeVisible({ timeout: 5000 });
  });

  test.skip('should edit an existing property', async ({ page }) => {
    // Requires seeded property in database
    await page.goto('/properties');
    await page.getByText('Casa da Praia').click();
    await page.getByRole('button', { name: /editar|edit/i }).click();
    await page.getByLabel(/nome|name/i).clear();
    await page.getByLabel(/nome|name/i).fill('Casa da Praia Premium');
    await page.getByRole('button', { name: /guardar|save/i }).click();
    await expect(page.getByText('Casa da Praia Premium')).toBeVisible({ timeout: 5000 });
  });

  test.skip('should delete a property with confirmation', async ({ page }) => {
    // Requires seeded property with no active reservations
    await page.goto('/properties');
    await page.getByText('Casa da Praia Premium').click();
    await page.getByRole('button', { name: /eliminar|delete/i }).click();
    await page.getByRole('button', { name: /confirmar|confirm/i }).click();
    await expect(page.getByText('Casa da Praia Premium')).not.toBeVisible({ timeout: 5000 });
  });
});
