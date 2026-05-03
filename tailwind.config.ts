import type { Config } from 'tailwindcss'
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: { 
    extend: {
      colors: {
        brand: {
          red: '#C83232',
          black: '#0a0a0a',
          gray: '#808080',
          light: '#f4f4f5',
          white: '#ffffff',
        },
        navy: {
          600: '#2e5ea8',
          700: '#1d4e89',
          800: '#163d6e',
          900: '#0f2d52',
        },
      }
    } 
  },
  plugins: [],
}
export default config
