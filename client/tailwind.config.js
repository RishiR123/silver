/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        border: 'hsl(var(--border))',
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        ring: 'hsl(var(--ring))',
        input: 'hsl(var(--input))',
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          raised: 'hsl(var(--surface-raised))',
          card: 'hsl(var(--surface-card))',
          overlay: 'hsl(var(--surface-overlay))',
        },
        ink: {
          1: 'hsl(var(--ink-1))',
          2: 'hsl(var(--ink-2))',
          3: 'hsl(var(--ink-3))',
          4: 'hsl(var(--ink-4))',
          5: 'hsl(var(--ink-5))',
          6: 'hsl(var(--ink-6))',
          7: 'hsl(var(--ink-7))',
        },
        line: {
          strong: 'hsl(var(--line-strong))',
          DEFAULT: 'hsl(var(--line-mid))',
          subtle: 'hsl(var(--line-subtle))',
          connector: 'hsl(var(--line-connector))',
        },
        'ui-hover': 'hsl(var(--ui-hover))',
        'ui-active': 'hsl(var(--ui-active))',
        'tree-line': 'var(--tree-line)',
        'tree-line-hover': 'var(--tree-line-hover)',
        'file-tree': {
          bg: 'transparent',
          hover: 'hsl(var(--ui-hover))',
        },
        folder: {
          icon: 'oklch(0.78 0.13 85)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
      },
    },
  },
  plugins: [],
}
