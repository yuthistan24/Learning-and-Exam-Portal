import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        signup: resolve(__dirname, 'signup.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        learning: resolve(__dirname, 'learning.html'),
        exam: resolve(__dirname, 'exam.html'),
        manageExam: resolve(__dirname, 'manage-exam.html'),
        results: resolve(__dirname, 'results.html'),
        teacherEvaluation: resolve(__dirname, 'teacher-evaluation.html'),
        resultReport: resolve(__dirname, 'result-report.html'),
        examAnalytics: resolve(__dirname, 'exam-analytics.html'),
        admin: resolve(__dirname, 'admin.html')
      }
    }
  },
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/python': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
