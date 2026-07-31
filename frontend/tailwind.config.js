/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bgMain: "#40403E",
        bgCard: "#59595B",
        borderSoft: "#8C8C8B",
        textSoft: "#BFBFBD",
        bgInput: "#F2EAE4",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
