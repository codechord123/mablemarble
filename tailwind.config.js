/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        game: ['Pretendard Variable', 'Pretendard', '"Noto Sans KR"', 'system-ui', 'sans-serif'],
        sans: ['Pretendard Variable', 'Pretendard', '"Noto Sans KR"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
