import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom', // Вмикаємо фейковий браузер для роботи з DOM
  },
})