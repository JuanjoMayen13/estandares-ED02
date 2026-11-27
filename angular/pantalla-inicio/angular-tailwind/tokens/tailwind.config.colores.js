// Estándar pantalla de inicio v1.0.0 — colores para theme.extend de tailwind.config.js (mismos tokens que el estándar del login)
// Uso:
//   const colores = require('./tailwind.config.colores');
//   module.exports = { darkMode: 'class', content: [...], theme: { extend: { ...colores } } };
const colors = require('tailwindcss/colors');

module.exports = {
    colors: {
  
      // Tokens de superficie/estructura (ver el README del estándar, §2.1)
      surface: { DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)' },
      'surface-alt': { DEFAULT: 'rgb(var(--color-surface-alt) / <alpha-value>)' },
      'surface-raised': { DEFAULT: 'rgb(var(--color-surface-raised) / <alpha-value>)' },
      'surface-overlay': { DEFAULT: 'rgb(var(--color-surface-overlay) / <alpha-value>)' },
      page: { DEFAULT: 'rgb(var(--color-page) / <alpha-value>)' },
  
      primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
      secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
      muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
  
      brand: {
        DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
        hover: 'rgb(var(--color-brand-hover) / <alpha-value>)',
        active: 'rgb(var(--color-brand-active) / <alpha-value>)',
      },
      // Texto sobre un fondo de marca (`bg-brand`): blanco en claro y oscuro en oscuro, porque el
      // azul de marca del modo oscuro es claro y con texto blanco no pasa el contraste mínimo
      'on-brand': 'rgb(var(--color-on-brand) / <alpha-value>)',
      // Clave plana (no anidada bajo "ring") para que genere la clase `ring-focus`
      focus: 'rgb(var(--color-focus-ring) / <alpha-value>)',
  
      // Tokens de estado (alias directos de la paleta de Tailwind, ya traen toda la rampa)
      // Además de la rampa completa, cada estado trae `soft` (fondo tenue), `line` (borde) y
      // `strong` (texto), que resuelven claro y oscuro solos (ver docs/colores-modo-oscuro.md).
      success: {
        ...colors.green,
        soft: 'rgb(var(--color-success-soft) / <alpha-value>)',
        line: 'rgb(var(--color-success-line) / <alpha-value>)',
        strong: 'rgb(var(--color-success-strong) / <alpha-value>)',
      },
      danger: {
        ...colors.red,
        soft: 'rgb(var(--color-danger-soft) / <alpha-value>)',
        line: 'rgb(var(--color-danger-line) / <alpha-value>)',
        strong: 'rgb(var(--color-danger-strong) / <alpha-value>)',
      },
      warning: {
        ...colors.amber,
        soft: 'rgb(var(--color-warning-soft) / <alpha-value>)',
        line: 'rgb(var(--color-warning-line) / <alpha-value>)',
        strong: 'rgb(var(--color-warning-strong) / <alpha-value>)',
      },
      info: {
        ...colors.blue,
        soft: 'rgb(var(--color-info-soft) / <alpha-value>)',
        line: 'rgb(var(--color-info-line) / <alpha-value>)',
        strong: 'rgb(var(--color-info-strong) / <alpha-value>)',
      },
    },
    // Aparte de `colors`: nombrar una familia de color igual que el prefijo de la
    // utilidad ("border") generaría clases redundantes como `border-border`.
    // Extender `borderColor` directamente da las clases limpias `border`/`border-subtle`/`border-strong`.
    borderColor: {
      DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
      subtle: 'rgb(var(--color-border-subtle) / <alpha-value>)',
      strong: 'rgb(var(--color-border-strong) / <alpha-value>)',
    },
};
