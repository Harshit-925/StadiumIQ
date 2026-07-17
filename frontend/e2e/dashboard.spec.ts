import { test, expect } from '@playwright/test';

test.describe('Dashboard End-to-End Flow', () => {
  test('should analyze crowd density and display results', async ({ page }) => {
    // 1. Navigate to login page
    await page.goto('/login');

    // Wait for the page to fully hydrate (React lazy loading + Suspense)
    await page.waitForLoadState('networkidle');

    // 2. Click "Continue as Guest" — it's a React Router <Link> rendered as <a>
    const guestLink = page.getByRole('link', { name: /Continue as Guest/i });
    await expect(guestLink).toBeVisible({ timeout: 15000 });
    await guestLink.click();

    // 3. Expect to land on the overview dashboard
    await expect(page.getByRole('heading', { name: /Stadium Overview/i })).toBeVisible({ timeout: 15000 });

    // 4. Navigate to crowd dashboard via sidebar
    await page.getByRole('link', { name: 'Crowd Intel', exact: true }).first().click();

    // 5. Expect the input form header to be visible
    await expect(page.getByRole('heading', { name: /Crowd Analysis Input/i })).toBeVisible();

    // 6. Fill in the form
    await page.getByLabel(/Waste Recycled/i).fill('1000');
    await page.getByLabel(/Total Waste/i).fill('1100');

    // 7. Click the analysis button
    await page.getByRole('button', { name: /Run Analysis/i }).click();

    // 8. Verify the backend response is rendered on the page
    await expect(page.getByRole('heading', { name: /Zone Density Breakdown/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Evacuation Assessment/i })).toBeVisible();

    // 9. Navigate to emergency panel to check another feature
    await page.getByRole('link', { name: /Emergency/i }).click();
    await expect(page.getByRole('heading', { name: /Emergency Triage/i })).toBeVisible();
    
    // 10. Fill emergency form
    await page.getByRole('button', { name: /Generate Action Plan/i }).click();
    
    // 11. Wait for response
    await expect(page.getByText('Triage Assessment')).toBeVisible({ timeout: 15000 });
  });
});
