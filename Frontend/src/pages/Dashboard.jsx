import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, Heart, Plus, Trash2, TrendingUp, Users } from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import PatientAvatar from "../components/PatientAvatar.jsx";
import AddPatientDialog from "../components/AddPatientDialog.jsx";
import { deletePatient, useStore } from "../lib/store.js";
import { alertLevel } from "../lib/hrv.js";

const ACTIVE_WINDOW_MS = 10 * 60 * 1000;

export default function Dashboard() {
  const patients = useStore((s) => s.patients);
  const readings = useStore((s) => s.readings);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const latest = (p) => readings[p.id]?.at(-1);
  const now = Date.now();
  const active = patients.filter((p) => latest(p) && now - latest(p).t < ACTIVE_WINDOW_MS).length;
  const critical = patients.filter((p) => alertLevel(latest(p)) === "critical").length;
  const high = patients.filter((p) => alertLevel(latest(p)) === "high").length;

  function handleDelete(p) {
    if (confirm(`Remove ${p.name} and all of their readings?`)) deletePatient(p.id);
  }

  return (
    <div className="p-6 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">HrVita</h1>
          <p className="mt-2 text-lg text-slate-600">Heart Rate Variability Monitoring System</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Add Patient
        </button>
      </header>

      <section className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Patients" value={patients.length} icon={Users} footer="Registered" footerIcon={TrendingUp} />
        <StatCard title="Active Monitoring" value={active} icon={Activity} footer="Live tracking" footerIcon={Heart} footerClass="text-blue-600" />
        <StatCard title="Critical Alerts" value={critical} icon={AlertTriangle} iconClass="text-red-600" footer={critical ? "Needs attention" : "All clear"} footerClass={critical ? "text-red-600" : "text-slate-500"} />
        <StatCard title="High Priority" value={high} icon={AlertTriangle} iconClass="text-orange-500" footer={high ? "Review soon" : "No issues"} footerClass={high ? "text-orange-600" : "text-slate-500"} />
      </section>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Users className="h-5 w-5" /> Patient Overview
        </h2>

        {patients.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-medium">No patients yet</p>
            <p className="mt-1 text-sm text-slate-500">Add a patient to start monitoring their heart rate.</p>
            <button onClick={() => setDialogOpen(true)} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Add Patient
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
            {patients.map((p) => {
              const level = alertLevel(latest(p));
              return (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <PatientAvatar patient={p} />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-xl font-bold">{p.name}</h3>
                      <p className="text-sm text-slate-600">ID: {p.patientId}</p>
                    </div>
                    {level !== "none" && (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${level === "critical" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                        {level === "critical" ? "Critical" : "High priority"}
                      </span>
                    )}
                    <button onClick={() => handleDelete(p)} aria-label={`Remove ${p.name}`} className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => navigate(`/heartratemonitor?id=${p.id}`)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Activity className="h-4 w-4" /> View Heart Rate Data
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <AddPatientDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
