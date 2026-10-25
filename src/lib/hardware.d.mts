export const hardwareProduct: { readonly id: string; readonly name: string; readonly priceCents: number; readonly path: string; readonly checkoutPath: string; readonly processor: string; readonly ram: string; readonly storage: string; readonly monitor: string; readonly warranty: string; readonly supplierWeightGrams: number; readonly printerWeightGrams: number; readonly shippingWeightGrams: number; readonly items: readonly string[] };
export function cepDigits(value: unknown): string;
export function formatCep(value: unknown): string;
export function validHardwarePhotos(value: unknown): { src: string; alt: string }[];
