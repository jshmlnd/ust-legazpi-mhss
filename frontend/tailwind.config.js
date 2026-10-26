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
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        script: ['"KG Second Chances"', 'cursive'],
      },
      // ── Evergreen semantic tokens ─────────────────────────────
      // Values come from CSS variables in src/index.css. rgb triplets enable
      // /alpha ops.
      colors: {
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        raised: 'rgb(var(--c-raised) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          soft: 'rgb(var(--c-ink-soft) / <alpha-value>)',
          muted: 'rgb(var(--c-ink-muted) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--c-line) / <alpha-value>)',
          strong: 'rgb(var(--c-line-strong) / <alpha-value>)',
        },
        brand: {
          50: 'rgb(var(--c-brand-50) / <alpha-value>)',
          100: 'rgb(var(--c-brand-100) / <alpha-value>)',
          200: 'rgb(var(--c-brand-200) / <alpha-value>)',
          300: 'rgb(var(--c-brand-300) / <alpha-value>)',
          400: 'rgb(var(--c-brand-400) / <alpha-value>)',
          500: 'rgb(var(--c-brand-500) / <alpha-value>)',
          600: 'rgb(var(--c-brand-600) / <alpha-value>)',
          700: 'rgb(var(--c-brand-700) / <alpha-value>)',
          800: 'rgb(var(--c-brand-800) / <alpha-value>)',
          900: 'rgb(var(--c-brand-900) / <alpha-value>)',
          fg: 'rgb(var(--c-brand-fg) / <alpha-value>)',
          soft: 'rgb(var(--c-brand-soft) / <alpha-value>)',
          'soft-ink': 'rgb(var(--c-brand-soft-ink) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--c-success) / <alpha-value>)',
          soft: 'rgb(var(--c-success-soft) / <alpha-value>)',
          ink: 'rgb(var(--c-success-ink) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--c-warning) / <alpha-value>)',
          soft: 'rgb(var(--c-warning-soft) / <alpha-value>)',
          ink: 'rgb(var(--c-warning-ink) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--c-danger) / <alpha-value>)',
          soft: 'rgb(var(--c-danger-soft) / <alpha-value>)',
          ink: 'rgb(var(--c-danger-ink) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--c-info) / <alpha-value>)',
          soft: 'rgb(var(--c-info-soft) / <alpha-value>)',
          ink: 'rgb(var(--c-info-ink) / <alpha-value>)',
        },
        side: {
          DEFAULT: 'rgb(var(--c-side) / <alpha-value>)',
          ink: 'rgb(var(--c-side-ink) / <alpha-value>)',
          'ink-soft': 'rgb(var(--c-side-ink-soft) / <alpha-value>)',
          'ink-muted': 'rgb(var(--c-side-ink-muted) / <alpha-value>)',
          // static white overlays (identical in both modes) — no alpha-value,
          // because the overlay alpha is baked in
          hover: 'rgb(255 255 255 / 0.08)',
          active: 'rgb(255 255 255 / 0.12)',
          line: 'rgb(255 255 255 / 0.10)',
        },
      },
      boxShadow: {
        'e1': '0 2px 6px rgb(25 76 49 / 0.06)',
        'e2': '0 8px 20px -8px rgb(25 76 49 / 0.16), 0 2px 6px -2px rgb(25 76 49 / 0.08)',
        'e3': '0 24px 50px -18px rgb(25 76 49 / 0.22), 0 10px 22px -10px rgb(25 76 49 / 0.12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'modal-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'modal-in': 'modal-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
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
          "secondary": "oklch(96% 0.018 95)",
          "secondary-content": "oklch(35% 0.04 155)",
          "accent": "oklch(88% 0.08 145)",
          "accent-content": "oklch(35% 0.04 155)",
          "neutral": "oklch(35% 0.04 155)",
          "neutral-content": "oklch(98% 0.012 95)",
          "base-100": "oklch(99% 0.012 95)",
          "base-200": "oklch(96% 0.018 145)",
          "base-300": "oklch(91% 0.025 145)",
          "base-content": "oklch(35% 0.04 155)",
          "info": "oklch(72.06% 0.191 231.6)",
          "info-content": "oklch(0% 0 0)",
          "success": "oklch(64.8% 0.15 160)",
          "success-content": "oklch(0% 0 0)",
          "warning": "oklch(82% 0.189 84.429)",
          "warning-content": "oklch(0% 0 0)",
          "error": "oklch(71.76% 0.221 22.18)",
          "error-content": "oklch(0% 0 0)",
          "--rounded-box": "0.5rem",
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "0.5rem",
        }
      },
    ]
  }
}
