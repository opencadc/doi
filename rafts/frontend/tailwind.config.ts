const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',

        // Form-specific colors
        form: {
          input: {
            bg: 'var(--input-background)',
            border: 'var(--input-border)',
            text: 'var(--input-text)',
            focus: {
              border: 'var(--input-focus-border)',
              ring: 'var(--input-focus-ring)',
            },
          },
          label: 'var(--label-text)',
          helper: 'var(--helper-text)',
          heading: 'var(--header-text)',
          fieldset: {
            bg: 'var(--fieldset-background)',
            border: 'var(--fieldset-border)',
            legend: 'var(--legend-text)',
          },
          button: {
            bg: 'var(--button-background)',
            hover: 'var(--button-hover)',
            text: 'var(--button-text)',
          },
        },
      },
      // Other theme extensions can go here
    },
  },
  corePlugins: {
    preflight: false, // Prevent Tailwind from resetting MUI styles
  },
  plugins: [],
}
export default config
