/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
    "./lib/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Iran Observatory brand stack
        heading: ['"Cabinet Grotesk"', '"IBM Plex Sans"', "system-ui", "sans-serif"],
        body: ['"IBM Plex Sans"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
        persian: ['"Vazirmatn"', '"IBM Plex Sans"', "sans-serif"],
      },
      colors: {
        // Iran Observatory palette
        navy: "#1E3A5F",
        "navy-dark": "#0f1e2e",
        "navy-light": "#2A4A73",
        emerald: "#3DB883",
        accent: "#F59E0B",
        cream: "#fbfaf7",
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
