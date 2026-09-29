// Polls an ESP32 on the local network for heart-rate data.
// Expected endpoint: GET http://<ip>/data  ->  {"bpm": 72}
// (see firmware/esp32_hrv.ino for a matching sketch)

export async function fetchBpm(ip, { timeoutMs = 3000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`http://${ip}/data`, { signal: controller.signal });
    if (!res.ok) throw new Error(`ESP32 responded with ${res.status}`);
    const data = await res.json();
    const bpm = Number(data.bpm ?? data.hr ?? data.heartRate);
    if (!Number.isFinite(bpm)) throw new Error("ESP32 response had no bpm value");
    return bpm;
  } finally {
    clearTimeout(timer);
  }
}

// Generates plausible heart-rate values for demoing without hardware.
export function createSimulator(start = 80) {
  let bpm = start;
  return () => {
    bpm += (Math.random() - 0.5) * 30;
    bpm = Math.min(190, Math.max(45, bpm));
    return bpm;
  };
}
