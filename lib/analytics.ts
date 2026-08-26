import type { PriceSampleDocument, PriceStats } from "@/lib/types";

export function calculatePriceStats(samples: PriceSampleDocument[], mrp?: number): PriceStats {
  const sorted = [...samples].sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());

  if (sorted.length === 0) {
    return {
      sampleCount: 0,
      mrp,
      changes: {
        count: 0,
        description: "No price history yet"
      }
    };
  }

  const highest = sorted.reduce((best, item) => (item.price > best.price ? item : best), sorted[0]);
  const lowest = sorted.reduce((best, item) => (item.price < best.price ? item : best), sorted[0]);
  const current = sorted[sorted.length - 1];

  const effectiveMrp = mrp && mrp > current.price ? mrp : undefined;
  const savings = effectiveMrp
    ? {
        amount: effectiveMrp - current.price,
        percentage: Math.round(((effectiveMrp - current.price) / effectiveMrp) * 100)
      }
    : undefined;

  const counts = new Map<number, number>();
  sorted.forEach((sample) => {
    counts.set(sample.price, (counts.get(sample.price) || 0) + 1);
  });

  const [commonPrice, commonCount] = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0] - b[0];
  })[0];

  const changedAt: Date[] = [];
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].price !== sorted[index - 1].price) {
      changedAt.push(sorted[index].capturedAt);
    }
  }

  const intervals = changedAt
    .slice(1)
    .map((date, index) => date.getTime() - changedAt[index].getTime())
    .filter((value) => value > 0);

  const averageMs =
    intervals.length > 0 ? intervals.reduce((sum, value) => sum + value, 0) / intervals.length : undefined;
  const averageHours = averageMs ? averageMs / (1000 * 60 * 60) : undefined;
  const averageDays = averageHours ? averageHours / 24 : undefined;

  return {
    sampleCount: sorted.length,
    highest: {
      price: highest.price,
      capturedAt: highest.capturedAt.toISOString()
    },
    lowest: {
      price: lowest.price,
      capturedAt: lowest.capturedAt.toISOString()
    },
    common: {
      price: commonPrice,
      occurrences: commonCount,
      percentage: Math.round((commonCount / sorted.length) * 100)
    },
    current: {
      price: current.price,
      capturedAt: current.capturedAt.toISOString()
    },
    mrp: effectiveMrp,
    savings,
    changes: {
      count: changedAt.length,
      averageHoursBetweenChanges: averageHours ? Math.round(averageHours * 10) / 10 : undefined,
      averageDaysBetweenChanges: averageDays ? Math.round(averageDays * 10) / 10 : undefined,
      description: describeChangeFrequency(changedAt.length, averageHours)
    }
  };
}

function describeChangeFrequency(changeCount: number, averageHours?: number): string {
  if (changeCount === 0) return "No price changes observed yet";
  if (!averageHours) return "Changed once in the tracked history";
  if (averageHours < 24) return `Changes about every ${Math.round(averageHours)} hours`;
  return `Changes about every ${Math.round((averageHours / 24) * 10) / 10} days`;
}
