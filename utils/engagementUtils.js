import fs from 'fs';
import path from 'path';

const cacheFile = path.join(process.cwd(), 'graphs', 'engagement_cache.json');

export function loadPreviousEngagements() {
  try {
    const data = fs.readFileSync(cacheFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return {}; // No file yet
  }
}

export function saveEngagements(current) {
  fs.writeFileSync(cacheFile, JSON.stringify(current, null, 2));
}

export function compareEngagements(current, previous) {
  const summary = [];
  for (const [period, value] of Object.entries(current)) {
    const prev = previous[period];
    const delta = prev != null ? Math.round(value - prev) : null;
    const msg =
      delta == null
        ? `${labelMap(period)}: ${value}s`
        : delta === 0
          ? `${labelMap(period)}: ${value}s (no change)`
          : `${labelMap(period)}: ${value}s ${delta > 0 ? ':up-arrow:  +' : ':down-arrow:  '}${Math.abs(delta)} sec`;
    summary.push(msg);
  }
  return summary.join('\n');
}

function labelMap(p) {
  const map = {
    last_7_days:  '         • Engagement time since a week',
    last_14_days: '         • Engagement time since 14 days',
    last_28_days: '         • Engagement time since 28 days',
    last_30_days: '         • Engagement time since 30 days',
    last_60_days: '         • Engagement time since 60 days'
  };
  return map[p] || p;
}
