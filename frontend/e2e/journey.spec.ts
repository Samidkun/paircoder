import { test, expect } from '@playwright/test';

test.describe('Paircoder End-to-End Interview Workflow', () => {
  test('Journey 1: Landing page features and Start CTA', async ({ page }) => {
    await page.goto('/');

    // Check title and hero
    await expect(page).toHaveTitle(/Paircoder/);
    await expect(page.locator('h1')).toContainText('Collaborative technical interviews');

    // Click Start Interview Free CTA -> transitions to Auth
    await page.getByRole('button', { name: 'Start Interview Free' }).click();
    await expect(page.locator('h2')).toContainText('Interviewer Portal');
  });

  test('Journey 2: Auth submission routes to Dashboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '2. Auth' }).click();

    // Fill form and submit
    await page.getByRole('button', { name: 'Continue to Dashboard' }).click();
    await expect(page.locator('h1')).toContainText('Interview Sessions');
    await expect(page.getByText('Sarah Jenkins')).toBeVisible();
  });

  test('Journey 3: Lobby pre-flight room configuration and link copy', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '4. Lobby' }).click();

    await expect(page.getByText('Room: a8f9-c2e1-4b7d')).toBeVisible();
    await expect(page.getByText('Status: Waiting')).toBeVisible();

    // Click Enter Live Room -> enters Active Room
    await page.getByRole('button', { name: 'Enter Live Room' }).click();
    await expect(page.getByText('a8f9-c2e1-4b7d').first()).toBeVisible();
  });

  test('Journey 4: Active room code editing and Judge0 execution', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '5. Room Active' }).click();

    // Check presence
    await expect(page.getByText('You (Interviewer)')).toBeVisible();
    await expect(page.getByText('Sarah (Candidate)')).toBeVisible();

    // Run Code button
    const runBtn = page.getByRole('button', { name: 'Run Code' });
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // Verify stdout console output appears
    await expect(page.locator('#root')).toContainText('Judge0');
  });

  test('Journey 5: Session Replay scrubber and playback', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '6. Replay' }).click();

    await expect(page.getByText('Keystroke Milestones')).toBeVisible();
    await expect(page.getByText('1x')).toBeVisible();
    await expect(page.getByText('2x')).toBeVisible();

    // Click Scorecard button in replay header
    await page.getByRole('button', { name: 'Scorecard →' }).click();
    await expect(page.locator('h1')).toContainText('Candidate Scorecard');
  });

  test('Journey 6: Scorecard evaluation form and public share token view', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '7. Scorecard' }).click();

    await expect(page.getByText('Problem Solving & Algorithms')).toBeVisible();
    await expect(page.getByText('Code Quality & Idioms')).toBeVisible();

    // Switch to public view
    await page.getByRole('button', { name: 'Public View (No-Auth)' }).click();
    await expect(page.getByText('Public No-Auth View')).toBeVisible();
    await expect(page.getByText('Strong Hire Recommendation')).toBeVisible();
  });
});
