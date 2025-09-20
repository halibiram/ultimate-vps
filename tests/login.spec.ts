import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow a user to log in with correct credentials', async ({ page }) => {
    // 1. Navigate to the login page.
    // The `baseURL` is configured in `playwright.config.ts`.
    await page.goto('/');

    // 2. Verify the login form is visible.
    await expect(page.locator('#loginForm')).toBeVisible();
    await expect(page.locator('#dashboard')).toBeHidden();

    // 3. Fill in the username and password.
    // The credentials match the ones in our seeding script.
    await page.locator('#username').fill('testuser');
    await page.locator('#password').fill('password123');

    // 4. Click the login button.
    await page.locator('button[type="submit"]').click();

    // 5. Assert that the login was successful.
    // A successful login should hide the login form and show the dashboard.
    await expect(page.locator('#loginForm')).toBeHidden();
    await expect(page.locator('#dashboard')).toBeVisible();

    // 6. As an extra check, verify that an auth token was stored in local storage.
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
  });

  test('should show an error on invalid credentials', async ({ page }) => {
    // 1. Navigate to the login page.
    await page.goto('/');

    // 2. Fill in incorrect credentials.
    await page.locator('#username').fill('testuser');
    await page.locator('#password').fill('wrongpassword');

    // We need to handle the browser's alert dialog.
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.dismiss();
    });

    // 3. Click the login button.
    await page.locator('button[type="submit"]').click();

    // 4. Assert that the alert with the correct error message appeared.
    expect(alertMessage).toContain('Invalid credentials');

    // 5. Assert that the dashboard remains hidden.
    await expect(page.locator('#dashboard')).toBeHidden();
  });
});
