/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Resolves the food image URL based on the item's uploaded foto field.
 * Mengembalikan gambar kustom (Local/Base64) jika ada,
 * atau SVG Placeholder yang sangat ringan dan 100% OFFLINE (tanpa internet).
 */
export function getFoodImage(nama: string, kategori: string, customFoto?: string): string {
  // Jika admin sudah mengunggah foto lokal (ex: /uploads/img-123.jpg) atau base64
  if (customFoto && customFoto.trim() !== '') {
    if (customFoto.startsWith('/') || customFoto.startsWith('http') || customFoto.startsWith('data:image/')) {
      return customFoto;
    }
  }

  return getOfflineSvgFallback(nama, kategori);
}

export function getOfflineSvgFallback(nama: string, kategori: string): string {
  const catLower = (kategori || '').toLowerCase();
  const isDrink = catLower.includes('minum') || catLower.includes('drink') || catLower.includes('beverage') || catLower.includes('teh') || catLower.includes('tea') || catLower.includes('floridina') || catLower.includes('golda');
  const isSnack = catLower.includes('cemilan') || catLower.includes('snack') || catLower.includes('popcorn');

  let bg = '#fff7ed'; // Orange-50
  let circleBg = '#ffedd5'; // Orange-100
  let strokeColor = '#ea580c'; // Orange-600
  let iconPath = `
    <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/>
    <path d="M15 11v11"/>
    <path d="M5 2v10a3 3 0 0 0 3 3h1v7"/>
    <path d="M9 2a3 3 0 0 0-3 3v4"/>
  `; // Utensils

  if (isDrink) {
    bg = '#f0f9ff'; // Sky-50
    circleBg = '#e0f2fe'; // Sky-100
    strokeColor = '#0284c7'; // Sky-600
    iconPath = `
      <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
      <line x1="6" y1="2" x2="6" y2="4"/>
      <line x1="10" y1="2" x2="10" y2="4"/>
      <line x1="14" y1="2" x2="14" y2="4"/>
    `; // Cup
  } else if (isSnack) {
    bg = '#f8fafc'; // Slate-50
    circleBg = '#f1f5f9'; // Slate-100
    strokeColor = '#64748b'; // Slate-500
    iconPath = `
      <path d="M3 18h18"/>
      <path d="M19 18a7 7 0 0 0-14 0"/>
      <circle cx="12" cy="7" r="1.5" fill="${strokeColor}"/>
      <path d="M6 21h12"/>
    `; // Cloche
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="none">
    <rect width="400" height="300" fill="${bg}"/>
    <circle cx="200" cy="150" r="54" fill="${circleBg}"/>
    <g transform="translate(176, 126) scale(2)" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
      ${iconPath}
    </g>
  </svg>`;

  try {
    if (typeof window !== 'undefined' && window.TextEncoder && window.btoa) {
      const bytes = new TextEncoder().encode(svg);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return `data:image/svg+xml;base64,${window.btoa(binary)}`;
    }
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch (err) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
}
