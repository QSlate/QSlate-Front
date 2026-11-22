import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/widgets/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/entities/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gain: {
          DEFAULT: 'var(--gain)',
          soft: 'var(--gain-soft)',
        },
        loss: {
          DEFAULT: 'var(--loss)',
          soft: 'var(--loss-soft)',
        },
        canvas: 'var(--bg)',
        surface: 'var(--surface)',
        raised: 'var(--raised)',
        sunken: 'var(--sunken)',
        line: {
          DEFAULT: 'var(--line)',
          soft: 'var(--line-2)',
          strong: 'var(--line-strong)',
        },
        fg: {
          DEFAULT: 'var(--fg)',
          2: 'var(--fg-2)',
          3: 'var(--fg-3)',
        },
        a1: 'var(--a1)',
        a2: 'var(--a2)',
        brand: {
          DEFAULT: 'var(--brand)',
          soft: 'var(--brand-soft)',
          line: 'var(--brand-line)',
        },
        warn: {
          DEFAULT: 'var(--warn)',
          soft: 'var(--warn-soft)',
        },
        vio: {
          DEFAULT: 'var(--vio)',
          soft: 'var(--vio-soft)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
          soft: 'var(--amber-soft)',
        },
        signal: '#00E5FF',
        foreground: '#FFFFFF',
        'muted-foreground': '#A1A1AA',
        matte: '#050505',
        widget: 'rgba(255, 255, 255, 0.05)',
        accent: {
          DEFAULT: 'var(--accent)',
          dim: 'var(--accent-dim)',
          border: 'var(--accent-border)',
        },
        scrollbar: {
          thumb: 'var(--scrollbar-thumb)',
          'thumb-hover': 'var(--scrollbar-thumb-hover)',
        },
        'card-inset': 'var(--card-inset)',
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      backgroundColor: {
        base: 'var(--bg-base)',
        card: 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        'card-subtle': 'var(--bg-card-subtle)',
        navbar: 'var(--bg-navbar)',
        'navbar-scrolled': 'var(--bg-navbar-scrolled)',
        panel: 'var(--bg-panel)',
        input: 'var(--bg-input)',
        'modal-backdrop': 'var(--bg-modal-backdrop)',
        'interactive-hover': 'var(--interactive-hover-bg)',
        'interactive-active': 'var(--interactive-active-bg)',
        'row-hover': 'var(--row-hover)',
        segment: 'var(--segment-bg)',
      },
      borderColor: {
        default: 'var(--border-default)',
        hover: 'var(--border-hover)',
        strong: 'var(--border-strong)',
        focus: 'var(--border-focus)',
        divider: 'var(--divider)',
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        muted: 'var(--text-muted)',
        inverse: 'var(--text-inverse)',
      },
      boxShadow: {
        card: 'var(--shadow-1)',
        pop: 'var(--shadow-2)',
        glow: '0 8px 22px -8px var(--glow)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, var(--a1), var(--a2))',
        'card-hl': 'var(--card-hl)',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
};

export default config;
