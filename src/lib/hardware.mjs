export const hardwareProduct = Object.freeze({
  id: 'pdv-completo',
  name: 'PDV completo',
  priceCents: 165000,
  path: '/equipamentos/pdv-completo',
  checkoutPath: '/equipamentos/pdv-completo/checkout',
  processor: 'Intel E7400 (Dual Core)',
  ram: '4 GB',
  storage: 'SSD de 120 GB',
  monitor: '15 polegadas',
  warranty: '3 meses',
  supplierWeightGrams: 8100,
  printerWeightGrams: 800,
  shippingWeightGrams: 8900,
  items: ['Computador Intel E7400', 'Memória RAM de 4 GB', 'SSD de 120 GB', 'Monitor de 15 polegadas', 'Teclado USB', 'Mouse USB', 'Impressora'],
});
export const cepDigits = value => String(value ?? '').replace(/\D/g, '').slice(0, 8);
export const formatCep = value => cepDigits(value).replace(/(\d{5})(\d)/, '$1-$2');
export function validHardwarePhotos(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(photo => {
    if (!photo || typeof photo.src !== 'string' || typeof photo.alt !== 'string') return false;
    if (/^\/equipamentos\/fotos\/[a-zA-Z0-9/_-]+\.(webp|png|jpe?g)$/i.test(photo.src)) return true;
    try { const url = new URL(photo.src); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
  }).slice(0, 10).map(photo => ({src: photo.src, alt: photo.alt.slice(0, 160)}));
}
