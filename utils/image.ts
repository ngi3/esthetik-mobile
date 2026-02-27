import { API_URL } from '../config/api.config';

/**
 * Convertit une URL d'image relative ou absolue en URL complète
 * Utilise la même logique que banner.tsx qui fonctionne sur iOS
 * @param imageUrl - URL de l'image (peut être relative ou absolue)
 * @returns URL complète prête à être utilisée dans une Image
 */
export const getFullImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const base = API_URL.replace(/\/$/, '');
  try {
    // If it's already absolute
    if (/^https?:\/\//i.test(url)) {
      const u = new URL(url);
      // If it points to uploads but a different host, rewrite to API_URL host
      if (u.pathname.startsWith('/uploads/')) {
        const b = new URL(base);
        return `${b.origin}${u.pathname}`;
      }
      return url;
    }
  } catch {
    // Fallback to simple join below
  }
  // Relative URL: join with API_URL
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
};/**
 * Prépare une source d'image pour le composant Image de React Native
 * Utilise la même logique que banner.tsx qui fonctionne sur iOS
 * @param imageUrl - URL de l'image
 * @param fallback - Image par défaut à utiliser si l'URL est invalide
 * @returns Source d'image prête pour le composant Image
 */
export const getImageSource = (
  imageUrl?: string | null,
  fallback: any = require('../assets/images/salon1.png')
) => {
  const fullUrl = getFullImageUrl(imageUrl);

  if (fullUrl) {
    console.log('Image URL resolved:', fullUrl);
    return { uri: fullUrl };
  }

  console.log('Using fallback image for:', imageUrl);
  return fallback;
};
