// Estándar pantalla de inicio v1.0.0 — iniciales y color del avatar (README §3.11)

/** Palabras que no aportan a las iniciales: «Cuentas de Cobro» → «CC», no «CD». */
const PALABRAS_VACIAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'o', 'a', 'en', 'para', 'por', 'con']);

/**
 * Tonos 700 de Tailwind (sky, emerald, violet, rose, teal, indigo, fuchsia, amber): con texto
 * blanco pasan de 4,5:1 en claro y en oscuro.
 */
export const COLORES_AVATAR = ['#0369a1', '#047857', '#6d28d9', '#be123c', '#0f766e', '#4338ca', '#a21caf', '#b45309'];

/** Dos letras que identifican un aplicativo en las barras compactas y listas. */
export function inicialesDe(texto: string): string {
  const palabras = (texto || '?').split(/\s+/).filter((p) => p && !PALABRAS_VACIAS.has(p.toLowerCase()));
  const letras = palabras.length > 1 ? palabras[0][0] + palabras[1][0] : (palabras[0] ?? '?').slice(0, 2);
  return letras.toUpperCase();
}

/** Iniciales del usuario: «juan.mayen» → «JM», «juan» → «JU». */
export function inicialesUsuario(usuario: string): string {
  const partes = (usuario || '').trim().split(/[\s._-]+/).filter(Boolean);
  const letras = partes.length > 1 ? partes[0][0] + partes[1][0] : (partes[0] ?? '?').slice(0, 2);
  return letras.toUpperCase();
}

/** Color propio de cada usuario, calculado de su nombre: siempre el mismo para la misma persona. */
export function colorUsuario(usuario: string): string {
  const nombre = (usuario || '').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = (hash * 31 + nombre.charCodeAt(i)) | 0;
  return COLORES_AVATAR[Math.abs(hash) % COLORES_AVATAR.length];
}
