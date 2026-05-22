/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./landing-a/**/*.html",
    "./landing-b/**/*.html",
    "./landing-c/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        /* KEI Events brand palette — confirm exact hex with Aricka Dean */
        'kei-red':         '#E63946',
        'kei-red-dark':    '#c01320',
        'kei-blue':        '#1D4ED8',
        'kei-blue-dark':   '#1e3a8a',
        'kei-blue-light':  '#dbeafe',
        'kei-yellow':      '#FACC15',
        'kei-yellow-dark': '#ca8a04',
        'kei-yellow-light':'#fefce8'
      },
      fontFamily: {
        sans:        ['"DM Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display:     ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        handwritten: ['Caveat', 'cursive']
      },
      fontSize: {
        'hero-xl': ['clamp(2.5rem, 6vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'hero-lg': ['clamp(2rem, 4.5vw, 3.5rem)',  { lineHeight: '1.08', letterSpacing: '-0.015em' }],
        'section': ['clamp(1.75rem, 3vw, 2.5rem)',  { lineHeight: '1.15', letterSpacing: '-0.01em' }]
      },
      maxWidth: {
        container: '1280px'
      },
      boxShadow: {
        card:  '0 1px 0 rgba(15,20,25,.06), 0 8px 24px -12px rgba(15,20,25,.12)',
        lift:  '0 20px 50px -20px rgba(15,20,25,.25)',
        'card-blue': '0 1px 0 rgba(29,78,216,.08), 0 8px 24px -12px rgba(29,78,216,.18)'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ]
}
