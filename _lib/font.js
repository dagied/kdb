// lib/fonts.js
export const ethiopicFonts = {
  googleFont: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap',
  fallbacks: [
    'Noto Sans Ethiopic',
    'Nyala',
    'Abyssinica SIL',
    'Ethiopia Jiret',
    'Visual Geez Unicode',
    'Code2000',
    'sans-serif'
  ],
  getFontFamily: () => {
    return ethiopicFonts.fallbacks.join(', ');
  }
};