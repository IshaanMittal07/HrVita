// Heart-rate variability helpers.
// "Std Dev" here is the rolling standard deviation of the last N heart-rate
// readings, which is what the dashboard charts and alerts are based on.

export const SD_WINDOW = 10;

// Lower variability is the warning sign. Tune these for your use case.
export const THRESHOLDS = {
  critical: 15, // SD below this -> critical alert
  high: 25, // SD below this -> high priority
};

export function stdDev(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// Builds the next reading from a new heart rate, using prior readings for the rolling SD.
export function makeReading(hr, previous = []) {
  const window = [...previous.slice(-(SD_WINDOW - 1)).map((r) => r.hr), hr];
  return {
    t: Date.now(),
    hr: Math.round(hr),
    sd: Number(stdDev(window).toFixed(2)),
  };
}

export function alertLevel(reading) {
  // Need a few samples before SD means anything
  if (!reading) return "none";
  if (reading.sd < THRESHOLDS.critical) return "critical";
  if (reading.sd < THRESHOLDS.high) return "high";
  return "none";
}

export function summarize(readings) {
  if (!readings.length) return null;
  const sds = readings.map((r) => r.sd);
  return {
    current: sds[sds.length - 1],
    average: sds.reduce((a, b) => a + b, 0) / sds.length,
    min: Math.min(...sds),
    max: Math.max(...sds),
    count: readings.length,
  };
}
