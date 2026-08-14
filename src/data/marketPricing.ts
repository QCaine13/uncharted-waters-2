// Pure price-index math for the market dynamics model (design:
// docs/superpowers/specs/2026-08-13-market-price-dynamics-design.md).
// Takes a region-adjusted reference price and an index; knows nothing about
// markets, goods, or `state`. Callers own reading/writing the index and
// persisting it.

export type MarketPriceEntry = {
  index: number;
  updatedDay: number;
};

// Tuning constants (design spec section 2.5), kept together. Expect to
// retune after play.
export const MARGIN = 0.1;
export const MIN_INDEX = 40;
export const MAX_INDEX = 200;
export const IMPACT_UNITS_PER_POINT = 3;
export const REGRESSION_POINTS_PER_DAY = 1;

export const DEFAULT_INDEX = 100;

const clampIndex = (index: number): number =>
  Math.min(MAX_INDEX, Math.max(MIN_INDEX, index));

// Lazy regression: an index left untouched drifts back toward DEFAULT_INDEX
// at REGRESSION_POINTS_PER_DAY per elapsed day, never overshooting it. No
// stored entry means the index has never moved off default.
export const getCurrentIndex = (
  entry: MarketPriceEntry | undefined,
  currentDay: number,
): number => {
  if (!entry) return DEFAULT_INDEX;

  const drift =
    Math.max(0, currentDay - entry.updatedDay) * REGRESSION_POINTS_PER_DAY;

  if (entry.index > DEFAULT_INDEX) {
    return Math.max(DEFAULT_INDEX, entry.index - drift);
  }
  if (entry.index < DEFAULT_INDEX) {
    return Math.min(DEFAULT_INDEX, entry.index + drift);
  }
  return DEFAULT_INDEX;
};

// 100 * 1.1 === 110.00000000000001 in floating point, which would nudge an
// exact value past a ceil/floor boundary. Round off that noise first.
const roundOffFloatingPointNoise = (value: number): number =>
  Math.round(value * 1e6) / 1e6;

export const getBuyPrice = (referencePrice: number, index: number): number =>
  Math.max(
    1,
    Math.ceil(
      roundOffFloatingPointNoise(
        ((referencePrice * index) / 100) * (1 + MARGIN),
      ),
    ),
  );

// Buy floors at 1 and sell at 0, so buy > sell holds even at a degenerate
// reference price. A shared floor of 1 would collapse them to equal.
export const getSellPrice = (referencePrice: number, index: number): number =>
  Math.max(
    0,
    Math.floor(
      roundOffFloatingPointNoise(
        ((referencePrice * index) / 100) * (1 - MARGIN),
      ),
    ),
  );

export type TradeSettlement = {
  totalPrice: number;
  nextIndex: number;
};

const settle = (
  referencePrice: number,
  index: number,
  quantity: number,
  direction: 1 | -1,
  priceAt: (referencePrice: number, index: number) => number,
): TradeSettlement => {
  let remaining = Math.max(0, Math.floor(quantity));
  let currentIndex = clampIndex(index);
  let totalPrice = 0;

  while (remaining > 0) {
    const chunk = Math.min(remaining, IMPACT_UNITS_PER_POINT);
    totalPrice += priceAt(referencePrice, currentIndex) * chunk;
    currentIndex = clampIndex(currentIndex + direction);
    remaining -= chunk;
  }

  return { totalPrice, nextIndex: currentIndex };
};

// Trades settle in IMPACT_UNITS_PER_POINT chunks, recomputing the price
// after each one, so a large trade moves its own price instead of clearing
// at a single unit price.
export const settleBuy = (
  referencePrice: number,
  index: number,
  quantity: number,
): TradeSettlement => settle(referencePrice, index, quantity, 1, getBuyPrice);

export const settleSell = (
  referencePrice: number,
  index: number,
  quantity: number,
): TradeSettlement =>
  settle(referencePrice, index, quantity, -1, getSellPrice);
