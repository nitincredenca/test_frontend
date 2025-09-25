// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }


// module.exports = {
//   content: [
//     './src/**/*.{html,ts}'
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }

// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{html,ts}'
  ],
  theme: {
    extend: {
      fontFamily: {
        // Define custom font families
        lato: ['Lato', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        'roboto-condensed': ['Roboto Condensed', 'sans-serif'],
        calibri: ['Calibri', 'sans-serif'],
      },
    },
  },
  plugins: [],
};