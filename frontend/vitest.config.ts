import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.vitest.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
