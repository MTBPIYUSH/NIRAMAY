/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Nature-inspired colors
        nature: {
          50: "#f0f9f1",
          100: "#dcf1de",
          200: "#bae3be",
          300: "#8ecd94",
          400: "#5fb167",
          500: "#3f9347",
          600: "#2c7735",
          700: "#235f2b",
          800: "#1e4b25",
          900: "#1a3e21",
          950: "#0d2112",
        },
        ocean: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        leaf: {
          50: "#f1fcf3",
          100: "#dcf8e1",
          200: "#bbf0c5",
          300: "#8be29d",
          400: "#54ca6d",
          500: "#2eac47",
          600: "#208c36",
          700: "#1c702e",
          800: "#1a5a28",
          900: "#174a23",
          950: "#082911",
        },
        earth: {
          50: "#f9f6f1",
          100: "#f0e9dd",
          200: "#e0d0bc",
          300: "#cdb293",
          400: "#ba9169",
          500: "#ad7d4c",
          600: "#9c6a3f",
          700: "#815435",
          800: "#6b4630",
          900: "#5a3c2b",
          950: "#301e16",
        },
      },
      backgroundImage: {
        "leaf-pattern":
          "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjMmVhYzQ3IiBmaWxsLW9wYWNpdHk9IjAuMSIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIzIi8+PHBhdGggZD0iTTEwIDJjMS42NTcgMCAzIDEuMzQzIDMgM3MtMS4zNDMgMy0zIDMtMy0xLjM0My0zLTMgMS4zNDMtMyAzLTN6bTAgMTJjMS42NTcgMCAzIDEuMzQzIDMgM3MtMS4zNDMgMy0zIDMtMy0xLjM0My0zLTMgMS4zNDMtMyAzLTN6bTktOWMwIDEuNjU3LTEuMzQzIDMtMyAzcy0zLTEuMzQzLTMtMyAxLjM0My0zIDMtMyAzIDEuMzQzIDMgM3ptLTEyIDBjMCAxLjY1Ny0xLjM0MyAzLTMgM3MtMy0xLjM0My0zLTMgMS4zNDMtMyAzLTMgMyAxLjM0MyAzIDN6bTEyIDEyYzAgMS42NTctMS4zNDMgMy0zIDNzLTMtMS4zNDMtMy0zIDEuMzQzLTMgMy0zIDMgMS4zNDMgMyAzem0tMTIgMGMwIDEuNjU3LTEuMzQzIDMtMyAzcy0zLTEuMzQzLTMtMyAxLjM0My0zIDMtMyAzIDEuMzQzIDMgM3oiLz48L2c+PC9zdmc+');",
        "wave-pattern":
          "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjIwIiB2aWV3Qm94PSIwIDAgMTAwIDIwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yMSAxMGMwIDAgMTAtOCAwLThjLTggMC04IDgtOCA4czgtOCAxNi04YzEwIDAgMTAgOCAxMCA4cy0xMC04LTIwLThjLTEwIDAtMTAgOC0xMCA4czEwLTggMjAtOGMxMiAwIDEwIDggMTAgOHMtMTAtOC0yMC04UzAgMTAgMCAxMHMxMC04IDIwLThjMTAgMCAxMCA4IDEwIDh6IiBmaWxsPSIjMGVhNWU5IiBmaWxsLW9wYWNpdHk9IjAuMSIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+');",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
