module.exports = {
  purge: ['./index.js'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      dark: { raw: '(prefers-color-scheme: dark)' },
    },
  },
};
