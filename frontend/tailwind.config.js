import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        emerald: {
          "color-scheme": "light",
          "primary": "oklch(76.662% 0.135 153.45)",
          "primary-content": "oklch(33.387% 0.04 162.24)",
          "secondary": "oklch(82% 0.111 230.318)",
          "secondary-content": "oklch(100% 0 0)",
          "accent": "oklch(83% 0.145 321.434)",
          "accent-content": "oklch(0% 0 0)",
          "neutral": "oklch(35.519% 0.032 262.988)",
          "neutral-content": "oklch(98.462% 0.001 247.838)",
          "base-100": "oklch(100% 0 0)",
          "base-200": "oklch(93% 0 0)",
          "base-300": "oklch(86% 0 0)",
          "base-content": "oklch(35.519% 0.032 262.988)",
          "info": "oklch(72.06% 0.191 231.6)",
          "info-content": "oklch(0% 0 0)",
          "success": "oklch(64.8% 0.15 160)",
          "success-content": "oklch(0% 0 0)",
          "warning": "oklch(82% 0.189 84.429)",
          "warning-content": "oklch(0% 0 0)",
          "error": "oklch(71.76% 0.221 22.18)",
          "error-content": "oklch(0% 0 0)",
          "--rounded-box": "2rem",
          "--rounded-btn": "2rem",
          "--rounded-badge": "2rem",
        }
      },
      {
        "emerald-dark": {
          "color-scheme": "dark",
          "primary": "oklch(80% 0.14 153.45)",
          "primary-content": "oklch(20% 0.04 162.24)",
          "secondary": "oklch(82% 0.111 230.318)",
          "secondary-content": "oklch(20% 0.04 162.24)",
          "accent": "oklch(83% 0.145 321.434)",
          "accent-content": "oklch(0% 0 0)",
          "neutral": "oklch(35.519% 0.032 262.988)",
          "neutral-content": "oklch(98.462% 0.001 247.838)",
          "base-100": "oklch(21% 0 0)",
          "base-200": "oklch(16% 0 0)",
          "base-300": "oklch(12% 0 0)",
          "base-content": "oklch(93% 0 0)",
          "info": "oklch(72.06% 0.191 231.6)",
          "info-content": "oklch(20% 0.04 162.24)",
          "success": "oklch(64.8% 0.15 160)",
          "success-content": "oklch(20% 0.04 162.24)",
          "warning": "oklch(82% 0.189 84.429)",
          "warning-content": "oklch(20% 0.04 162.24)",
          "error": "oklch(71.76% 0.221 22.18)",
          "error-content": "oklch(20% 0.04 162.24)",
          "--rounded-box": "2rem",
          "--rounded-btn": "2rem",
          "--rounded-badge": "2rem",
        }
      }
    ]
  }
}
