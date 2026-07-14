import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 120 * 1000,
      env: {
        VITE_API_URL: 'http://127.0.0.1:8000/api',
      }
    },
    {
      command: 'cd ../backend && py -m uvicorn app.main:app --host 127.0.0.1 --port 8000',
      url: 'http://127.0.0.1:8000/api/health',
      reuseExistingServer: false,
      timeout: 120 * 1000,
      env: {
        ENVIRONMENT: 'test',
        SUPABASE_URL: 'http://localhost',
        SUPABASE_JWT_SECRET: 'test-jwt-secret-for-unit-tests-only',
        SUPABASE_SERVICE_ROLE_KEY: 'mock-key',
        GEMINI_API_KEY: 'mock-key',
      }
    }
  ],
});
