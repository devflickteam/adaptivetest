
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#132A13",
      },
      fontFamily: {
        amiri: ["Amiri", "serif"],
      },
      boxShadow: {
        soft: "0 6px 20px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
