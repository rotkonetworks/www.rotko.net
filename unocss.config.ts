// unocss.config.ts
import { defineConfig } from '@unocss/vite';
import { presetMini } from '@unocss/preset-mini';

export default defineConfig({
  presets: [presetMini()],
  theme: {
    fontFamily: {
      mono: ['monospace']
    }
  },
  rules: [
    // 3D transform utilities
    ['perspective-1000', { 'perspective': '1000px' }],
    ['transform-style-preserve-3d', { 'transform-style': 'preserve-3d' }],
    ['backface-hidden', { 'backface-visibility': 'hidden' }],
    ['rotate-y-180', { 'transform': 'rotateY(180deg)' }],
    
    // Float animation
    ['animate-float', { 
      'animation': 'float 3s ease-in-out infinite',
      '@keyframes float': {
        '0%, 100%': { transform: 'translateY(0px)' },
        '50%': { transform: 'translateY(-10px)' }
      }
    }],
    
    // Pulse animation for cursor
    ['animate-pulse', {
      'animation': 'pulse 1s infinite',
      '@keyframes pulse': {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0' }
      }
    }],
  ]
});
