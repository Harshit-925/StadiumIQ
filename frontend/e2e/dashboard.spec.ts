import { test, expect } from '@playwright/test';

test.describe('Dashboard End-to-End Flow', () => {
  test('should analyze crowd density and display results', async ({ page }) => {
    // 1. Navigate to login and click "Continue as Guest"
    await page.goto('/login');
    await page.getByRole('link', { name: /Continue as Guest/i }).click();

    // 2. Expect to land on the overview dashboard
    await expect(page.getByRole('heading', { name: /Stadium Overview/i })).toBeVisible();

    // 3. Navigate to crowd dashboard
    await page.getByRole('link', { name: 'Crowd Intel', exact: true }).first().click();

    // 4. Expect the input form header to be visible
    await expect(page.getByRole('heading', { name: /Crowd Analysis Input/i })).toBeVisible();

    // 5. Fill in the form
    await page.getByLabel(/Waste Recycled/i).fill('1000');
    await page.getByLabel(/Total Waste/i).fill('1100');

    // 4. Click the analysis button
    await page.getByRole('button', { name: /Run Analysis/i }).click();

    // 5. Verify the backend response is rendered on the page
    // The analysis should populate the Dashboard overview sections

    // Check for some expected metrics from the default 'metlife' venue (or generic text)
    // Look for specific breakdown or recommendation block
    await expect(page.getByRole('heading', { name: /Zone Density Breakdown/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Evacuation Assessment/i })).toBeVisible();

    // 6. Navigate to emergency panel to check another feature
    await page.getByRole('link', { name: /Emergency/i }).click();
    await expect(page.getByRole('heading', { name: /Emergency Triage/i })).toBeVisible();
    
    // Fill emergency form
    await page.getByRole('button', { name: /Generate Action Plan/i }).click();
    
    // Wait for AI response mock (which we set up in backend tests)
    await expect(page.getByText('Triage Assessment')).toBeVisible({ timeout: 10000 });
  });
});
