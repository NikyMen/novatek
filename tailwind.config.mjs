/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Azul profundo de los gráficos Mundial 2026
        navy: {
          DEFAULT: '#0A1628',
          950: '#060D18',
          900: '#0A1628',
          800: '#0D1B2E',
          700: '#102339',
          600: '#16304F',
          500: '#1E3F66',
          400: '#2C5688',
        },
        // Naranja de marca Novatek
        brand: {
          DEFAULT: '#F26A1B',
          50: '#FFF4EC',
          100: '#FFE3D1',
          200: '#FFC4A1',
          300: '#FFA06B',
          400: '#FF8038',
          500: '#F26A1B',
          600: '#DE530A',
          700: '#B23F08',
          800: '#8A3008',
        },
        // Celeste argentino y dorado de la copa (acentos)
        celeste: '#74ACDF',
        gold: '#E9B949',
      },
      fontFamily: {
        display: ['Anton', 'Archivo Black', 'Impact', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.2em',
      },
      boxShadow: {
        glow: '0 0 60px -12px rgba(242,106,27,0.55)',
        'glow-sm': '0 0 30px -8px rgba(242,106,27,0.5)',
        card: '0 20px 50px -20px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'navy-gradient': 'linear-gradient(160deg,#0D1B2E 0%,#0A1628 55%,#060D18 100%)',
        'orange-gradient': 'linear-gradient(135deg,#FF8038 0%,#F26A1B 50%,#DE530A 100%)',
        'pitch-glow': 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(116,172,223,0.18), transparent 60%)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%,100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-up': 'fade-up 0.7s ease-out both',
      },
    },
  },
  plugins: [],
}
