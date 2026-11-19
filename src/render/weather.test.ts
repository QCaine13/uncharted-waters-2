import { weatherFor, WEATHERS } from './weather';

describe('weatherFor', () => {
  it('is deterministic for the same port and day', () => {
    expect(weatherFor('1', 42)).toBe(weatherFor('1', 42));
  });

  it('varies by port and by day', () => {
    const a = new Set(Array.from({ length: 30 }, (_, d) => weatherFor('1', d)));
    const b = new Set(Array.from({ length: 30 }, (_, d) => weatherFor('2', d)));
    expect(a.size).toBeGreaterThan(1);
    expect(b.size).toBeGreaterThan(1);
  });

  it('returns only known kinds', () => {
    Array.from({ length: 500 }, (_, d) =>
      weatherFor(String(d % 50), d),
    ).forEach((w) => expect(WEATHERS).toContain(w));
  });

  it('stays roughly within the 60/20/12/8 distribution', () => {
    const counts = { clear: 0, cloudy: 0, rain: 0, fog: 0 };
    const N = 4000;

    for (let d = 0; d < N; d += 1) {
      counts[weatherFor('1', d)] += 1;
    }

    expect(counts.clear / N).toBeGreaterThan(0.5);
    expect(counts.clear / N).toBeLessThan(0.7);
    expect(counts.cloudy / N).toBeGreaterThan(0.12);
    expect(counts.cloudy / N).toBeLessThan(0.3);
    expect(counts.rain / N).toBeGreaterThan(0.06);
    expect(counts.rain / N).toBeLessThan(0.2);
    expect(counts.fog / N).toBeGreaterThan(0.03);
    expect(counts.fog / N).toBeLessThan(0.15);
  });
});
