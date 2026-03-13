import { nanoid, customAlphabet } from 'nanoid';

const MIN_NANOID_LENGTH = 10;

const nanoidAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
const customNanoid = customAlphabet(nanoidAlphabet, MIN_NANOID_LENGTH);

export function generateSheetId(slug: string): string {
  const randomPart = customNanoid();
  return `${slug}-${randomPart}`;
}

export function validateNanoid(nanoid: string): boolean {
  return nanoid.length >= MIN_NANOID_LENGTH && !nanoid.includes('-');
}

export function parseSheetId(fullId: string): { slug: string; nanoid: string } {
  const lastDashIndex = fullId.lastIndexOf('-');
  if (lastDashIndex === -1) {
    throw new Error('Invalid sheet ID format');
  }
  return {
    slug: fullId.slice(0, lastDashIndex),
    nanoid: fullId.slice(lastDashIndex + 1),
  };
}
