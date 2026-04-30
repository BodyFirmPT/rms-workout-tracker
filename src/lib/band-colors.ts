// Band color resolution: maps a (band category, resistance level) tuple to a
// named/colored swatch using either a per-client override or the system default.

export type BandCategory = 'band' | 'ankle_weight';
export type ResistanceLevel =
  | 'extra_light'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'extra_heavy';

export interface BandColorOption {
  id: string;
  name: string;
  hex: string;
  sort_order?: number;
}

export interface ClientBandMapping {
  id: string;
  client_id: string;
  band_category: BandCategory;
  resistance_level: ResistanceLevel;
  color_id: string;
}

// Resistance levels per category (in order, weakest → strongest).
export const RESISTANCE_LEVELS: Record<BandCategory, ResistanceLevel[]> = {
  band: ['extra_light', 'light', 'medium', 'heavy', 'extra_heavy'],
  ankle_weight: ['light', 'medium', 'heavy'],
};

export const RESISTANCE_LABELS: Record<ResistanceLevel, string> = {
  extra_light: 'Extra Light',
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
  extra_heavy: 'Extra Heavy',
};

// System default mapping (resistance level → color name).
export const DEFAULT_BAND_MAPPING: Record<
  BandCategory,
  Partial<Record<ResistanceLevel, string>>
> = {
  band: {
    extra_light: 'White',
    light: 'Yellow',
    medium: 'Green',
    heavy: 'Blue',
    extra_heavy: 'Black',
  },
  ankle_weight: {
    light: 'Green',
    medium: 'Pink',
    heavy: 'Black',
  },
};

// Band-type values that count as ankle weights for category purposes.
export function categoryFromBandType(bandType: string | null | undefined): BandCategory {
  if (!bandType) return 'band';
  return bandType.toLowerCase() === 'ankle-weight' ? 'ankle_weight' : 'band';
}

export interface ResolvedBandColor {
  name: string;
  hex: string;
}

const FALLBACK: ResolvedBandColor = { name: 'Unknown', hex: '#9ca3af' };

export function resolveBandColor(args: {
  clientId?: string | null;
  bandCategory: BandCategory;
  resistanceLevel: ResistanceLevel;
  palette: BandColorOption[];
  mappings?: ClientBandMapping[];
}): ResolvedBandColor {
  const { clientId, bandCategory, resistanceLevel, palette, mappings } = args;

  const byId = new Map(palette.map((c) => [c.id, c]));
  const byName = new Map(palette.map((c) => [c.name.toLowerCase(), c]));

  // 1. Per-client override
  if (clientId && mappings && mappings.length > 0) {
    const override = mappings.find(
      (m) =>
        m.client_id === clientId &&
        m.band_category === bandCategory &&
        m.resistance_level === resistanceLevel,
    );
    if (override) {
      const c = byId.get(override.color_id);
      if (c) return { name: c.name, hex: c.hex };
    }
  }

  // 2. System default
  const defaultName = DEFAULT_BAND_MAPPING[bandCategory][resistanceLevel];
  if (defaultName) {
    const c = byName.get(defaultName.toLowerCase());
    if (c) return { name: c.name, hex: c.hex };
    return { name: defaultName, hex: FALLBACK.hex };
  }

  return FALLBACK;
}
