// Colours resolve to the CSS variables in src/index.css; fonts are loaded in public/index.html.
const color = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: color('primary'), dark: color('primary-dark') },
        accent: color('accent'),
        canvas: color('canvas'),
        ink: color('ink'),
        surface: color('surface'),
        success: color('success'),
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -12px rgb(var(--color-primary) / 0.28)',
        soft: '0 2px 10px -2px rgb(var(--color-ink) / 0.10)',
      },
    },
  },
  plugins: [],
};
