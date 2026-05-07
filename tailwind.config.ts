import type { Config } from 'tailwindcss';


export default {
  theme: {
    extend: {
      colors: {
        sky: {
          50: '#A5E6E2',
          100: '#77DAD7',
          200: '#77DAD7',
          300: '#36B8B7',
          400: '#36B8B7',
          500: '#36B8B7',
          600: '#0A85BC',
          700: '#0B757B',
          800: '#0B757B',
          900: '#0B757B',
          1000:'#0C0C0C',
        },
      blueCardAccent: {
        100: "#050927",
        200: "#0b124d",
        300: "#101a74",
        400: "#16239a",
        500: "#1b2cc1",
        600: "#4956cd",
        700: "#7680da",
        800: "#a4abe6",
        900: "#d1d5f3",
},
      },
      
        borderRadius: {
        DEFAULT: '0px', // global reset
        sm: '4px',      // buttons, inputs
        md: '8px',      // cards, panels
        lg: '12px',     // modals, popups
        xl: '16px',     // optional larger elements
        full: '50%',    // avatars, badges
        tab: '28px', // for tab containers
        },
          backgroundImage: {
    'tab-active': 'linear-gradient(135deg,#1f87ad,#0f6d8d)',
  },
  boxShadow: {
    'tab-active': '0 12px 30px rgba(32,141,183,0.22)',
  },
      fontSize: {
      xs: ["0.8rem", { lineHeight: "1.4" }],
      sm: ["0.925rem", { lineHeight: "1.5" }],
      base: ["1.05rem", { lineHeight: "1.6" }],
    },
    },
  },
} satisfies Config;



