import { defineConfig } from '@unocss/vite';
import { presetMini } from '@unocss/preset-mini';
import { presetIcons } from '@unocss/preset-icons';

export default defineConfig({
  presets: [
    presetMini(),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle'
      }
    })
  ],
  theme: {
    fontFamily: {
      mono: ['monospace']
    }
  },
  rules: [
    ['perspective-1000', { 'perspective': '1000px' }],
    ['transform-style-preserve-3d', { 'transform-style': 'preserve-3d' }],
    ['backface-hidden', { 'backface-visibility': 'hidden' }],
    ['rotate-y-180', { 'transform': 'rotateY(180deg)' }]
  ],
  safelist: [
    'i-mdi-github',
    'i-mdi-linkedin',
    'i-mdi-map-marker',
    'i-mdi-code-braces',
    'i-mdi-laptop',
    'i-mdi-desktop-classic',
    'i-mdi-console',
    'i-mdi-shield-lock',
    'i-mdi-lightning-bolt',
    'i-mdi-web',
    'i-mdi-bookshelf',
    'i-mdi-lock',
    'i-mdi-lightbulb',
    'i-mdi-check',
    'i-mdi-check-circle'
  ]
});
