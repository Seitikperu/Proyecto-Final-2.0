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
          red: '#C83232', // Rojo corporativo según la imagen
          black: '#0a0a0a', // Negro corporativo
          gray: '#808080', // Gris corporativo
          light: '#f4f4f5', // Gris claro para fondos
          white: '#ffffff', // Blanco
        }
      }
    } 
  },
  plugins: [],
}
export default config
