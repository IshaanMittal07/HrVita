import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { addPatient, getState } from "../lib/store.js";

const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;

export default function AddPatientDialog({ open, onClose }) {
  const [name, setName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");
  const nameRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setPatientId("");
    setPhoto(null);
    setError("");
    setTimeout(() => nameRef.current?.focus(), 0);
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Photo is larger than 1.5 MB. Choose a smaller image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !patientId.trim()) {
      setError("Full name and patient ID are required.");
      return;
    }
    if (getState().patients.some((p) => p.patientId === patientId.trim())) {
      setError(`Patient ID ${patientId.trim()} is already in use.`);
      return;
    }
    addPatient({ name, patientId, photo });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-patient-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="add-patient-title" className="text-lg font-semibold">Add New Patient</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <p className="mb-3 text-sm font-medium">Patient Photo (Optional)</p>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50">
                {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <Upload className="h-6 w-6 text-slate-400" />}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                className="w-full rounded-lg border border-slate-200 text-sm file:mr-3 file:border-0 file:bg-transparent file:px-4 file:py-2 file:font-medium"
              />
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Full Name *</span>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Patient ID *</span>
            <input
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="PT-2024-001"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Add Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
