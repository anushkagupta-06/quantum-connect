module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          orbitron: ['Orbitron', 'sans-serif'],
          poppins: ['Poppins', 'sans-serif'],
        },
        colors: {
          primary: "#7F00FF",
          secondary: "#E100FF",
          darkBg: "#0D0C1D",
        },
      },
    },
    plugins: [],
  }  