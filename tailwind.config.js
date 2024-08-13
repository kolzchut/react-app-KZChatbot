/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false,
  },
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    fontFamily: {
      sans: ['"Open Sans"'],
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--kzcb-border)",
        disclaimer: "var(--kzcb-disclaimer-foreground)",
        input: {
          DEFAULT: "var(--kzcb-input-background)",
          placholder: "var(--kzcb-input-placeholder)",
        },
        button: {
          DEFAULT: "var(--kzcb-button-background)",
          foreground: "var(--kzcb-button-foreground)",
        },
        textArea: {
          placholder: "var(--kzcb-textarea-placeholder)",
          border: "var(--kzcb-textarea-border)",
        },
        cta: {
          DEFAULT: "var(--kzcb-cta-background)",
          foreground: "var(--kzcb-cta-foreground)",
        },
        message: {
          bot: {
            background: "var(--kzcb-message-bot-background)",
            foreground: "var(--kzcb-message-bot-foreground)",
          },
          user: {
            background: "var(--kzcb-message-user-background)",
            foreground: "var(--kzcb-message-user-foreground)",
          },
        },
        links: {
          foreground: "var(--kzcb-links-foreground)",
        },
        line: "var(--kzcb-breaking-line)",
        ring: "var(--ring)",
        background: "var(--kzcb-background)",
        foreground: "var(--kzcb-foreground)",
        primary: {
          DEFAULT: "var(--kzcb-primary)",
          foreground: "var(--kzcb-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--kzcb-secondary)",
          foreground: "var(--kzcb-secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--kzcb-destructive-foreground)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--kzcb-muted)",
          foreground: "var(--kzcb-muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--kzcb-accent)",
          foreground: "var(--kzcb-accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--kzcb-popover)",
          foreground: "var(--kzcb-popover-foreground)",
        },
        card: {
          DEFAULT: "var(--kzcb-card)",
          foreground: "var(--kzcb-card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--kzcb-radius)",
        md: "calc(var(--kzcb-radius) - 2px)",
        sm: "calc(var(--kzcb-radius) - 4px)",
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
