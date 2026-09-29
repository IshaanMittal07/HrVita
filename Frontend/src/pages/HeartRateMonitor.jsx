import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Activity, ArrowLeft, FlaskConical, Square, TrendingDown, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import StatCard from "../components/StatCard.jsx";
import PatientAvatar from "../components/PatientAvatar.jsx";
import { addReading, clearReadings, getState, useStore } from "../lib/store.js";
import { makeReading, summarize } from "../lib/hrv.js";
import { createSimulator, fetchBpm } from "../lib/esp32.js";

const POLL_MS = 2000;
const CHART_POINTS = 100;
const EMPTY = [];

export default function HeartRateMonitor() {
  const [params] = useSearchParams();
  const id = params.get("id");
  const patients = useStore((s) => s.patients);
  const patient = patients.find((p) => p.id === id);

  if (!patient) return <PatientPicker patients={patients} />;
  return <Monitor key={patient.id} patient={patient} />;
}

function PatientPicker({ patients }) {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold">Heart Rate Monitor</h1>
      <p className="mt-2 text-slate-600">Choose a patient to view their readings.</p>
      {patients.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          No patients yet. <Link to="/dashboard" className="font-medium text-blue-600 hover:underline">Add one on the dashboard</Link>.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((p) => (
            <Link key={p.id} to={`/heartratemonitor?id=${p.id}`} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300">
              <PatientAvatar patient={p} size="h-12 w-12" />
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-slate-500">ID: {p.patientId}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Monitor({ patient }) {
  const navigate = useNavigate();
  const readings = useStore((s) => s.readings[patient.id] ?? EMPTY);
  const stats = summarize(readings);

  const [ip, setIp] = useState(() => localStorage.getItem("hrvita:esp32ip") || "");
  const [mode, setMode] = useState("idle"); // idle | esp32 | sim
  const [status, setStatus] = useState("");
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  function record(bpm) {
    const previous = getState().readings[patient.id] || [];
    addReading(patient.id, makeReading(bpm, previous));
  }

  function stop() {
    clearInterval(timer.current);
    setMode("idle");
    setStatus("");
  }

  function connect() {
    const host = ip.trim();
    if (!host) {
      setStatus("Enter the ESP32 IP address first.");
      return;
    }
    stop();
    localStorage.setItem("hrvita:esp32ip", host);
    setMode("esp32");
    setStatus(`Connecting to ${host}…`);
    let failures = 0;
    const tick = async () => {
      try {
        record(await fetchBpm(host));
        failures = 0;
        setStatus(`Connected to ${host}`);
      } catch (err) {
        failures += 1;
        setStatus(`Can't reach ${host}: ${err.message}. Retrying…`);
        if (failures >= 5) {
          clearInterval(timer.current);
          setMode("idle");
          setStatus(`Stopped after 5 failed attempts. Check that the ESP32 is on the same network and the IP is correct.`);
        }
      }
    };
    tick();
    timer.current = setInterval(tick, POLL_MS);
  }

  function simulate() {
    stop();
    const next = createSimulator(readings.at(-1)?.hr ?? 80);
    setMode("sim");
    setStatus("Generating simulated readings");
    record(next());
    timer.current = setInterval(() => record(next()), POLL_MS);
  }

  const chartData = readings.slice(-CHART_POINTS).map((r) => ({
    time: new Date(r.t).toLocaleTimeString(),
    hr: r.hr,
    sd: r.sd,
  }));
  const fmt = (n) => (n == null ? "–" : n.toFixed(2));

  return (
    <div className="p-6 md:p-8">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate("/dashboard")} aria-label="Back to dashboard" className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PatientAvatar patient={patient} />
        <div>
          <h1 className="text-3xl font-bold">{patient.name}</h1>
          <p className="text-lg text-slate-600">Patient ID: {patient.patientId}</p>
        </div>
      </header>

      <section className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Current Std Dev" value={fmt(stats?.current)} icon={Activity} footer="Current variability" />
        <StatCard title="Average Std Dev" value={fmt(stats?.average)} icon={Activity} footer={`Based on ${stats?.count ?? 0} readings`} footerClass="text-blue-600" />
        <StatCard title="Min Std Dev" value={fmt(stats?.min)} icon={TrendingDown} footer="Lowest variability" />
        <StatCard title="Max Std Dev" value={fmt(stats?.max)} icon={TrendingUp} footer="Highest variability" />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">WiFi Connection</h2>
          <div className="mt-5 rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="flex items-center gap-2 font-semibold text-slate-700">
              {mode === "esp32" ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4" />} WiFi Connection
            </p>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium">ESP32 IP Address</span>
              <input
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="192.168.1.100"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <p className="mt-2 text-xs text-slate-500">Find the IP address in your ESP32 Serial Monitor</p>

            {mode === "idle" ? (
              <>
                <button onClick={connect} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
                  <Wifi className="h-4 w-4" /> Connect to ESP32
                </button>
                <button onClick={simulate} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium hover:bg-slate-50">
                  <FlaskConical className="h-4 w-4" /> Use simulated data
                </button>
              </>
            ) : (
              <button onClick={stop} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 py-2.5 text-sm font-medium text-white hover:bg-slate-900">
                <Square className="h-4 w-4" /> Stop {mode === "sim" ? "simulation" : "monitoring"}
              </button>
            )}
            {status && <p className="mt-3 text-xs text-slate-600" role="status">{status}</p>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Activity className="h-5 w-5 text-blue-600" /> Heart Rate &amp; Standard Deviation
          </h2>
          <div className="mt-4 h-80">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
                Connect an ESP32 or use simulated data to see readings here.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={24} />
                  <YAxis yAxisId="hr" tick={{ fontSize: 11, fill: "#2563eb" }} label={{ value: "BPM", angle: -90, position: "insideLeft", fill: "#64748b" }} />
                  <YAxis yAxisId="sd" orientation="right" tick={{ fontSize: 11, fill: "#f59e0b" }} label={{ value: "Std Dev", angle: 90, position: "insideRight", fill: "#64748b" }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="hr" type="monotone" dataKey="hr" name="Heart rate (bpm)" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line yAxisId="sd" type="monotone" dataKey="sd" name="Std dev" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Readings</h2>
          {readings.length > 0 && (
            <button
              onClick={() => confirm("Delete all readings for this patient?") && clearReadings(patient.id)}
              className="text-sm text-slate-500 hover:text-red-600"
            >
              Clear readings
            </button>
          )}
        </div>
        {readings.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No readings yet.</p>
        ) : (
          <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
            {[...readings].reverse().slice(0, 100).map((r) => (
              <li key={r.t} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <span>{new Date(r.t).toLocaleString()}</span>
                <span className="flex gap-6">
                  <span className="font-bold text-blue-600">
                    HR: {r.hr} <span className="font-normal text-slate-500">bpm</span>
                  </span>
                  <span className="font-bold">SD: {r.sd.toFixed(2)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
