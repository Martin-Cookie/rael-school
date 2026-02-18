/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7f0',
          100: '#d9eed9',
          200: '#b3ddb3',
          300: '#80c780',
          400: '#4db34d',
          500: '#2d8a2d',
          600: '#236e23',
          700: '#1a531a',
          800: '#133813',
          900: '#0d260d',
        },
        accent: {
          50: '#fff8e6',
          100: '#ffedb3',
          200: '#ffe180',
          300: '#ffd64d',
          400: '#ffca1a',
          500: '#e6b300',
          600: '#b38a00',
          700: '#806300',
          800: '#4d3b00',
          900: '#1a1400',
        },
        earth: {
          50: '#faf5f0',
          100: '#f0e6d9',
          200: '#e0ccb3',
          300: '#c9a87a',
          400: '#b38a4d',
          500: '#8a6a2d',
          600: '#6e5423',
          700: '#533f1a',
          800: '#382a13',
          900: '#26190d',
        }
      }
    },
  },
  plugins: [],
}
