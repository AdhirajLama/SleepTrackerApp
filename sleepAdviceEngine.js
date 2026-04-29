/**
 * Rule-based sleep advice engine: profile + recent sleep logs.
 * Outputs score (0-100), confidence, references (general education only — not medical advice).
 */

const QUALITY_RANK = { Poor: 1, Average: 2, Good: 3, Excellent: 4 };
const QUALITY_LABEL = { 1: 'Poor', 2: 'Average', 3: 'Good', 4: 'Excellent' };

const REFERENCES = [
  {
    label: 'CDC — Sleep and Sleep Disorders',
    url: 'https://www.cdc.gov/sleep/index.html',
  },
  {
    label: 'NIH — Your Guide to Healthy Sleep',
    url: 'https://www.nhlbi.nih.gov/health-topics/all-sleep-topics',
  },
  {
    label: 'National Sleep Foundation — Sleep Hygiene',
    url: 'https://www.thensf.org/sleep-topics/sleep-hygiene/',
  },
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function numHours(entry) {
  const h = entry.hours;
  if (h == null || h === '') return null;
  const n = typeof h === 'number' ? h : parseFloat(String(h), 10);
  return Number.isFinite(n) ? n : null;
}

function recommendedRangeForAge(age) {
  if (age == null || !Number.isFinite(age)) return { min: 7, max: 9, label: '7–9 hours (adults)' };
  if (age < 18) return { min: 8, max: 10, label: '8–10 hours (teens)' };
  if (age <= 25) return { min: 7, max: 9, label: '7–9 hours (young adults)' };
  if (age < 65) return { min: 7, max: 9, label: '7–9 hours (adults)' };
  return { min: 7, max: 8, label: '7–8 hours (older adults)' };
}

function sortByDateAsc(sleeps) {
  return [...sleeps].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return da - db;
  });
}

function recentWindow(sleeps, maxDays = 14) {
  const sorted = sortByDateAsc(sleeps);
  if (sorted.length <= maxDays) return sorted;
  return sorted.slice(-maxDays);
}

function averageHours(entries) {
  const vals = entries.map(numHours).filter((n) => n != null && n >= 0 && n <= 24);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function dominantQuality(entries) {
  const counts = {};
  for (const e of entries) {
    const q = e.quality || 'Unknown';
    counts[q] = (counts[q] || 0) + 1;
  }
  let best = 'Unknown';
  let n = 0;
  for (const [q, c] of Object.entries(counts)) {
    if (c > n) {
      n = c;
      best = q;
    }
  }
  return best;
}

function avgQualityRank(entries) {
  const ranks = entries
    .map((e) => QUALITY_RANK[e.quality])
    .filter((r) => r != null);
  if (ranks.length === 0) return null;
  return ranks.reduce((a, b) => a + b, 0) / ranks.length;
}

function stdDev(values) {
  if (!values || values.length < 2) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, x) => sum + (x - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function scheduleVarianceHours(recent) {
  const hours = recent.map(numHours).filter((h) => h != null);
  if (hours.length < 2) return null;
  return stdDev(hours);
}

function qualityVariance(recent) {
  const ranks = recent
    .map((e) => QUALITY_RANK[e.quality])
    .filter((r) => r != null);
  return stdDev(ranks);
}

function avgOfLastN(entries, n) {
  const slice = entries.slice(-n);
  return averageHours(slice);
}

function consecutiveCountFromEnd(entries, predicate) {
  let count = 0;
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    if (predicate(entries[i])) count += 1;
    else break;
  }
  return count;
}

/**
 * Heuristic 0-100 score from duration fit, quality, consistency, and profile modifiers.
 */
function computeScore({
  avgH,
  avgQR,
  range,
  scheduleVariance,
  qualityVarianceRank,
  last3AvgHours,
  last7AvgHours,
  prior7AvgHours,
  underSleepStreakNights,
  recentLen,
  profile,
}) {
  // Neutral baseline; components add/subtract in a transparent way.
  const breakdown = {
    baseline: 50,
    duration: 0,
    quality: 0,
    consistency: 0,
    trend: 0,
    lifestyle: 0,
    data: 0,
    streaks: 0,
  };

  if (avgH != null) {
    if (avgH >= range.min && avgH <= range.max) breakdown.duration += 22;
    else if (avgH < range.min) breakdown.duration -= clamp((range.min - avgH) * 6, 0, 30);
    else breakdown.duration -= clamp((avgH - range.max) * 3, 0, 18);
  }

  if (avgQR != null) {
    // Map avg quality rank roughly to [-12..+12]
    breakdown.quality += clamp((avgQR - 2.5) * 10, -14, 14);
  }

  if (scheduleVariance != null) {
    if (scheduleVariance >= 3) breakdown.consistency -= 10;
    else if (scheduleVariance >= 2) breakdown.consistency -= 6;
    else if (scheduleVariance <= 1) breakdown.consistency += 5;
  }

  if (qualityVarianceRank != null) {
    // High swing in quality suggests inconsistent routines; mild penalty.
    if (qualityVarianceRank >= 1.1) breakdown.consistency -= 4;
    else if (qualityVarianceRank <= 0.6) breakdown.consistency += 2;
  }

  if (last3AvgHours != null && avgH != null) {
    const delta = last3AvgHours - avgH;
    if (delta <= -1.25) breakdown.trend -= 8;
    else if (delta <= -0.75) breakdown.trend -= 5;
    else if (delta >= 0.75) breakdown.trend += 3;
  }

  if (last7AvgHours != null && prior7AvgHours != null) {
    const delta7 = last7AvgHours - prior7AvgHours;
    if (delta7 <= -1.0) breakdown.trend -= 6;
    else if (delta7 >= 1.0) breakdown.trend += 2;
  }

  if (underSleepStreakNights >= 3) breakdown.streaks -= 8;
  else if (underSleepStreakNights === 2) breakdown.streaks -= 4;

  if (recentLen >= 10) breakdown.data += 3;
  else if (recentLen >= 7) breakdown.data += 2;

  const sched = profile.scheduleConsistency || 'somewhat_consistent';
  if (sched === 'consistent') breakdown.lifestyle += 4;
  if (sched === 'irregular') breakdown.lifestyle -= 6;

  const screen = profile.screenUseBeforeBed || 'sometimes';
  if (screen === 'often') breakdown.lifestyle -= 8;
  if (screen === 'rarely') breakdown.lifestyle += 3;

  const caf = profile.caffeineLevel || 'light';
  if (caf === 'heavy') breakdown.lifestyle -= 6;
  if (caf === 'moderate') breakdown.lifestyle -= 3;
  if (caf === 'none') breakdown.lifestyle += 2;

  const raw =
    breakdown.baseline +
    breakdown.duration +
    breakdown.quality +
    breakdown.consistency +
    breakdown.trend +
    breakdown.lifestyle +
    breakdown.data +
    breakdown.streaks;

  const score = clamp(Math.round(raw), 0, 100);
  return { score, breakdown };
}

function confidenceLabel(logCount) {
  if (logCount >= 10) return 'high';
  if (logCount >= 4) return 'medium';
  return 'low';
}

function confidenceExplanation(level) {
  if (level === 'high') {
    return 'Based on enough recent logs; patterns are more reliable.';
  }
  if (level === 'medium') {
    return 'Moderate data; keep logging to improve accuracy.';
  }
  return 'Limited logs; scores and tips are preliminary—add more nights for better insight.';
}

/**
 * @param {object} profile
 * @param {Array} sleeps
 */
function generateSleepAdvice(profile, sleeps) {
  const age = profile.age != null && Number.isFinite(Number(profile.age)) ? Number(profile.age) : null;
  const profession = profile.profession || 'other';
  const activityLevel = profile.activityLevel || 'moderate';
  const scheduleConsistency = profile.scheduleConsistency || 'somewhat_consistent';
  const screenUseBeforeBed = profile.screenUseBeforeBed || 'sometimes';
  const caffeineLevel = profile.caffeineLevel || 'light';

  const recent = recentWindow(sleeps || [], 14);
  const avgH = averageHours(recent);
  const domQ = dominantQuality(recent);
  const avgQR = avgQualityRank(recent);
  const schedVar = scheduleVarianceHours(recent);
  const qVar = qualityVariance(recent);
  const last3Avg = avgOfLastN(recent, 3);
  const last7Avg = avgOfLastN(recent, 7);
  const prior7Avg = recent.length >= 14 ? averageHours(recent.slice(0, 7)) : null;

  const range = recommendedRangeForAge(age);
  const conf = confidenceLabel(recent.length);

  const advice = [];
  const signals = [];

  const disclaimer =
    'These tips are for general wellness education only and are not a substitute for professional medical advice.';

  if (recent.length === 0) {
    return {
      summary: 'Add a few sleep logs so we can tailor advice to your patterns.',
      disclaimer,
      score: null,
      confidence: 'low',
      confidenceDetail: confidenceExplanation('low'),
      references: REFERENCES,
      metrics: {
        logCount: 0,
        avgHoursLast14: null,
        recommendedRange: range.label,
        dominantQuality: null,
        scheduleVarianceHours: null,
        avgQualityScore: null,
        qualityVarianceRank: null,
        last3AvgHours: null,
        last7AvgHours: null,
        prior7AvgHours: null,
        underSleepStreakNights: 0,
      },
      advice: [
        {
          title: 'Start logging sleep',
          detail:
            'Log date, hours, and quality for at least several nights. The engine uses your last ~14 entries to spot trends and combine them with your profile.',
        },
        {
          title: 'Complete your profile',
          detail:
            'Age, schedule consistency, screen use before bed, caffeine, profession, and activity help contextualize recommendations.',
        },
      ],
      signals: [],
    };
  }

  const underSleepStreakNights = consecutiveCountFromEnd(recent, (e) => {
    const h = numHours(e);
    return h != null && h < range.min;
  });

  if (avgH != null) {
    if (avgH < range.min) {
      signals.push({
        id: 'duration_low',
        level: avgH < range.min - 1 ? 'high' : 'medium',
        title: 'Short sleep duration',
        detail: `Recent average is ~${avgH.toFixed(1)} h/night vs a typical target of ${range.label}.`,
      });
      advice.push({
        title: 'Increase sleep duration',
        detail: `Your recent average is about ${avgH.toFixed(1)} hours/night. For your profile, aiming for ${range.label} may support better focus and recovery. Try a consistent bedtime and wind-down routine.`,
      });
    } else if (avgH > range.max + 1) {
      signals.push({
        id: 'duration_high',
        level: 'low',
        title: 'Long sleep duration',
        detail: `Recent average is ~${avgH.toFixed(1)} h/night. Occasional long sleep is normal; focus on consistency and how you feel.`,
      });
      advice.push({
        title: 'Check sleep duration and health',
        detail: `You're averaging about ${avgH.toFixed(1)} hours/night. Occasional long sleep can be normal, but if fatigue persists, consider discussing with a clinician; otherwise focus on consistent schedule.`,
      });
    } else {
      advice.push({
        title: 'Sleep duration looks reasonable',
        detail: `Your recent average (~${avgH.toFixed(1)} h) is in a healthy ballpark for ${range.label}. Keep consistency across weekdays and weekends.`,
      });
    }
  }

  if (avgQR != null && avgQR < 2.5) {
    signals.push({
      id: 'quality_low',
      level: avgQR < 2 ? 'high' : 'medium',
      title: 'Low perceived sleep quality',
      detail: `Average quality score is about ${avgQR.toFixed(2)} / 4.`,
    });
    advice.push({
      title: 'Improve perceived sleep quality',
      detail:
        'Quality is often below "Good." Limit screens 1h before bed, keep the room cool and dark, and avoid heavy meals and alcohol close to bedtime.',
    });
  } else if (avgQR != null && avgQR >= 3) {
    advice.push({
      title: 'Quality trend is encouraging',
      detail: 'Your logged quality is mostly Good or better. Maintain habits that work and note what changes on poorer nights.',
    });
  }

  if (schedVar != null && schedVar > 2) {
    signals.push({
      id: 'duration_variability',
      level: schedVar > 3 ? 'high' : 'medium',
      title: 'High night-to-night variability',
      detail: `Your sleep duration varies by about ${schedVar.toFixed(1)} hours (std. dev.) across recent nights.`,
    });
    advice.push({
      title: 'Night-to-night variation',
      detail: `Sleep duration varies by about ${schedVar.toFixed(1)} hours across recent nights. A stable wake time (even on weekends) often improves how rested you feel.`,
    });
  }

  if (underSleepStreakNights >= 3) {
    signals.push({
      id: 'undersleep_streak',
      level: 'high',
      title: 'Undersleep streak',
      detail: `You’ve logged ${underSleepStreakNights} consecutive night(s) below your target minimum (${range.min}h).`,
    });
    advice.push({
      title: 'Recover from a short-sleep streak',
      detail:
        'If you’re stacking multiple short nights, prioritize a slightly earlier bedtime for the next few days, keep wake time steady, and avoid trying to “fix it all” with very long weekend sleep.',
    });
  }

  if (last3Avg != null && avgH != null && last3Avg <= avgH - 1) {
    signals.push({
      id: 'recent_drop',
      level: 'medium',
      title: 'Recent dip',
      detail: `The last 3 nights average (~${last3Avg.toFixed(1)}h) is lower than your recent baseline.`,
    });
    advice.push({
      title: 'Recent dip: protect tonight',
      detail:
        'Your last few logs look shorter than usual. If possible, cut screens earlier, plan a wind-down, and protect a realistic bedtime tonight to prevent the dip from becoming a pattern.',
    });
  }

  if (scheduleConsistency === 'irregular') {
    advice.push({
      title: 'Schedule consistency',
      detail:
        'Irregular bed/wake times confuse your body clock. Pick a realistic wake time and move toward it in 15-minute steps over a week.',
    });
  } else if (scheduleConsistency === 'consistent') {
    advice.push({
      title: 'Consistent schedule',
      detail: 'Keeping regular sleep windows supports circadian alignment—great habit to maintain.',
    });
  }

  if (screenUseBeforeBed === 'often') {
    advice.push({
      title: 'Screens before bed',
      detail:
        'Blue light and stimulating content delay melatonin. Try dim warm light and non-screen wind-down 60–90 minutes before sleep.',
    });
  } else if (screenUseBeforeBed === 'rarely') {
    advice.push({
      title: 'Screen habits',
      detail: 'Limiting evening screens supports melatonin timing and deeper sleep onset.',
    });
  }

  if (caffeineLevel === 'heavy' || caffeineLevel === 'moderate') {
    advice.push({
      title: 'Caffeine timing',
      detail:
        caffeineLevel === 'heavy'
          ? 'Heavy caffeine use can fragment sleep. Cut off caffeine 8–10 hours before bed and taper gradually if needed.'
          : 'Moderate caffeine is fine for many people; avoid new cups after mid-afternoon.',
    });
  }

  if (profession === 'student') {
    advice.push({
      title: 'Student schedule',
      detail:
        'Irregular deadlines and late study sessions hurt sleep debt. Anchor a fixed wake time when possible and use short naps (20 min) instead of all-nighters before exams.',
    });
  } else if (profession === 'professional') {
    advice.push({
      title: 'Work and screens',
      detail:
        'Set a "hard stop" for work email, use night modes in evening, and batch late tasks to protect a non-negotiable wind-down window.',
    });
  } else if (profession === 'shift_worker') {
    advice.push({
      title: 'Shift work',
      detail:
        'Use blackout curtains, white noise, and consistent sleep windows even on days off. Bright light during night shifts (when appropriate) and darkness before day sleep helps anchor rhythm.',
    });
  }

  if (activityLevel === 'high') {
    advice.push({
      title: 'High activity',
      detail:
        'Training increases sleep need. Avoid intense workouts within 2–3 hours of bedtime; prioritize hydration and protein earlier in the day.',
    });
  } else if (activityLevel === 'low') {
    advice.push({
      title: 'Light activity',
      detail:
        'Even 20–30 minutes of daytime movement (walks) can deepen sleep pressure and improve mood without replacing lost hours.',
    });
  }

  if (age != null && age < 22) {
    advice.push({
      title: 'Young adult sleep',
      detail: 'Biological clock shifts late for many; keep wake time stable and get morning light to stabilize circadian timing.',
    });
  }

  const computed = computeScore({
    avgH,
    avgQR,
    range,
    scheduleVariance: schedVar,
    qualityVarianceRank: qVar,
    last3AvgHours: last3Avg,
    last7AvgHours: last7Avg,
    prior7AvgHours: prior7Avg,
    underSleepStreakNights,
    recentLen: recent.length,
    profile: {
      scheduleConsistency,
      screenUseBeforeBed,
      caffeineLevel,
    },
  });

  const summaryParts = [];
  if (avgH != null) summaryParts.push(`Average ~${avgH.toFixed(1)} h/night (last ${recent.length} log(s)).`);
  if (avgQR != null) summaryParts.push(`Avg quality: ${QUALITY_LABEL[Math.round(avgQR)] || domQ}.`);
  summaryParts.push(`Wellness score: ${computed.score}/100 (${conf} confidence).`);
  if (signals.length > 0) {
    const top = signals
      .filter((s) => s.level === 'high')
      .slice(0, 2)
      .map((s) => s.title);
    if (top.length > 0) summaryParts.push(`Top focus: ${top.join(', ')}.`);
  }
  summaryParts.push(`Recommendations factor in ${range.label} and your lifestyle.`);

  return {
    summary: summaryParts.join(' '),
    disclaimer,
    score: computed.score,
    scoreBreakdown: computed.breakdown,
    confidence: conf,
    confidenceDetail: confidenceExplanation(conf),
    references: REFERENCES,
    metrics: {
      logCount: recent.length,
      avgHoursLast14: avgH,
      recommendedRange: range.label,
      dominantQuality: domQ,
      avgQualityScore: avgQR != null ? Number(avgQR.toFixed(2)) : null,
      scheduleVarianceHours: schedVar != null ? Number(schedVar.toFixed(2)) : null,
      qualityVarianceRank: qVar != null ? Number(qVar.toFixed(2)) : null,
      last3AvgHours: last3Avg != null ? Number(last3Avg.toFixed(2)) : null,
      last7AvgHours: last7Avg != null ? Number(last7Avg.toFixed(2)) : null,
      prior7AvgHours: prior7Avg != null ? Number(prior7Avg.toFixed(2)) : null,
      underSleepStreakNights,
    },
    advice,
    signals,
  };
}

module.exports = { generateSleepAdvice };
