import { describe, it, expect } from 'vitest';
import {
  DOC_ARTICLES,
  REAL_WORLD_ENGINES,
  AEROSPACE_MATERIALS
} from '../src/views/DocumentationView/docsData';

describe('Documentation Knowledge Base & Specification Library', () => {
  it('contains comprehensive engineering articles across core categories', () => {
    expect(DOC_ARTICLES.length).toBeGreaterThanOrEqual(4);
    const categories = new Set(DOC_ARTICLES.map((a) => a.category));
    expect(categories.has('propulsion')).toBe(true);
    expect(categories.has('aerodynamics')).toBe(true);
    expect(categories.has('orbital')).toBe(true);

    for (const art of DOC_ARTICLES) {
      expect(art.id.length).toBeGreaterThan(0);
      expect(art.title.length).toBeGreaterThan(0);
      expect(art.content.trim().length).toBeGreaterThan(100);
    }
  });

  it('provides accurate real-world rocket engine specifications', () => {
    expect(REAL_WORLD_ENGINES.length).toBeGreaterThanOrEqual(5);

    const merlin = REAL_WORLD_ENGINES.find((e) => e.id === 'merlin-1d');
    expect(merlin).toBeDefined();
    expect(merlin!.ispVacuumSec).toBeGreaterThan(merlin!.ispSeaLevelSec);
    expect(merlin!.thrustVacuumKn).toBeGreaterThan(merlin!.thrustSeaLevelKn);

    const rs25 = REAL_WORLD_ENGINES.find((e) => e.id === 'rs-25');
    expect(rs25).toBeDefined();
    expect(rs25!.ispVacuumSec).toBeGreaterThan(440);
  });

  it('provides aerospace material properties with valid physical bounds', () => {
    expect(AEROSPACE_MATERIALS.length).toBeGreaterThanOrEqual(5);

    for (const mat of AEROSPACE_MATERIALS) {
      expect(mat.densityKgM3).toBeGreaterThan(0);
      expect(mat.yieldStrengthMpa).toBeGreaterThan(0);
      expect(mat.ultimateStrengthMpa).toBeGreaterThanOrEqual(mat.yieldStrengthMpa);
      expect(mat.maxServiceTempK).toBeGreaterThan(293);
    }
  });
});
