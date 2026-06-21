// Band color resolution: maps a (band type, resistance level) tuple to a
// named/colored swatch using either a per-client override or the system default.

export type BandType =
  | '1-handle'
  | '2-handle'
  | 'flat'
  | 'figure-8'
  | 'double-leg-cuff'
  | 'single-leg-cuff'
  | 'ankle-weight';

// Kept as a coarse category for resistance-level scale selection only.
export type BandCategory = 'band' | 'ankle_weight';

export type ResistanceLevel =
  | 'extra_light'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'extra_heavy'
  | 'two_x_heavy';

export interface BandColorOption {
  id: string;
  name: string;
  hex: string;
  sort_order?: number;
}

export interface ClientBandMapping {
  id: string;
  client_id: string;
  band_type: BandType;
  resistance_level: ResistanceLevel;
  color_id: string;
}

export const BAND_TYPES: BandType[] = [
  '1-handle',
  '2-handle',
  'flat',
  'figure-8',
  'double-leg-cuff',
  'single-leg-cuff',
  'ankle-weight',
];

export const BAND_TYPE_LABELS: Record<BandType, string> = {
  '1-handle': '1-Handle Band',
  '2-handle': '2-Handle Band',
  'flat': 'Flat Band',
  'figure-8': 'Figure-8 Band',
  'double-leg-cuff': 'Double Leg Cuff',
  'single-leg-cuff': 'Single Leg Cuff',
  'ankle-weight': 'Ankle Weight',
};

// Resistance levels per band type (in order, weakest → strongest).
const BAND_LEVELS: ResistanceLevel[] = [
  'extra_light',
  'light',
  'medium',
  'heavy',
  'extra_heavy',
  'two_x_heavy',
];
const ANKLE_LEVELS: ResistanceLevel[] = ['light', 'medium', 'heavy'];

export const RESISTANCE_LEVELS_BY_TYPE: Record<BandType, ResistanceLevel[]> = {
  '1-handle': BAND_LEVELS,
  '2-handle': BAND_LEVELS,
  'flat': BAND_LEVELS,
  'figure-8': BAND_LEVELS,
  'ankle-weight': ANKLE_LEVELS,
};

// Legacy export kept for any caller still using category-based scales.
export const RESISTANCE_LEVELS: Record<BandCategory, ResistanceLevel[]> = {
  band: BAND_LEVELS,
  ankle_weight: ANKLE_LEVELS,
};

export const RESISTANCE_LABELS: Record<ResistanceLevel, string> = {
  extra_light: 'Extra Light',
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
  extra_heavy: 'Extra Heavy',
  two_x_heavy: '2X Heavy',
};

// System default mapping (band type → resistance level → color name).
// All band varieties share the same default; ankle weights are distinct.
const BAND_DEFAULTS: Partial<Record<ResistanceLevel, string>> = {
  extra_light: 'White',
  light: 'Yellow',
  medium: 'Green',
  heavy: 'Red',
  extra_heavy: 'Blue',
  two_x_heavy: 'Black',
};
const ANKLE_DEFAULTS: Partial<Record<ResistanceLevel, string>> = {
  light: 'Green',
  medium: 'Pink',
  heavy: 'Black',
};

export const DEFAULT_BAND_MAPPING_BY_TYPE: Record<
  BandType,
  Partial<Record<ResistanceLevel, string>>
> = {
  '1-handle': BAND_DEFAULTS,
  '2-handle': BAND_DEFAULTS,
  'flat': BAND_DEFAULTS,
  'figure-8': BAND_DEFAULTS,
  'ankle-weight': ANKLE_DEFAULTS,
};

export function categoryFromBandType(bandType: string | null | undefined): BandCategory {
  if (!bandType) return 'band';
  return bandType.toLowerCase() === 'ankle-weight' ? 'ankle_weight' : 'band';
}

export function normalizeBandType(bandType: string | null | undefined): BandType | null {
  if (!bandType) return null;
  const lower = bandType.toLowerCase();
  return (BAND_TYPES as string[]).includes(lower) ? (lower as BandType) : null;
}

export interface ResolvedBandColor {
  name: string;
  hex: string;
}

const FALLBACK: ResolvedBandColor = { name: 'Unknown', hex: '#9ca3af' };

export function resolveBandColor(args: {
  clientId?: string | null;
  bandType: BandType;
  resistanceLevel: ResistanceLevel;
  palette: BandColorOption[];
  mappings?: ClientBandMapping[];
}): ResolvedBandColor {
  const { clientId, bandType, resistanceLevel, palette, mappings } = args;

  const byId = new Map(palette.map((c) => [c.id, c]));
  const byName = new Map(palette.map((c) => [c.name.toLowerCase(), c]));

  // 1. Per-client override
  if (clientId && mappings && mappings.length > 0) {
    const override = mappings.find(
      (m) =>
        m.client_id === clientId &&
        m.band_type === bandType &&
        m.resistance_level === resistanceLevel,
    );
    if (override) {
      const c = byId.get(override.color_id);
      if (c) return { name: c.name, hex: c.hex };
    }
  }

  // 2. System default
  const defaultName = DEFAULT_BAND_MAPPING_BY_TYPE[bandType]?.[resistanceLevel];
  if (defaultName) {
    const c = byName.get(defaultName.toLowerCase());
    if (c) return { name: c.name, hex: c.hex };
    return { name: defaultName, hex: FALLBACK.hex };
  }

  return FALLBACK;
}
