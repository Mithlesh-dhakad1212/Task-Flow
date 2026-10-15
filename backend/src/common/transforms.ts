import { Transform } from 'class-transformer';

/** Trims string input; leaves other types untouched so validators can reject them. */
export const Trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export const TrimLower = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));
