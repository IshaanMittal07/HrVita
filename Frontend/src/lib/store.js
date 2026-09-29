// Tiny persistent store backed by localStorage.
// Swap this file for Supabase/Firebase/your own API later without touching the UI.
import { useSyncExternalStore } from "react";

const KEY = "hrvita:v1";
const MAX_READINGS_PER_PATIENT = 500;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore corrupt storage */
  }
  return { patients: [], readings: {} };
}

let state = load();
const listeners = new Set();

function commit(next) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Could not save to localStorage", err);
  }
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStore(selector) {
  return useSyncExternalStore(subscribe, () => selector(state));
}

export function getState() {
  return state;
}

export function addPatient({ name, patientId, photo }) {
  const patient = {
    id: crypto.randomUUID(),
    name: name.trim(),
    patientId: patientId.trim(),
    photo: photo || null,
    createdAt: new Date().toISOString(),
  };
  commit({ ...state, patients: [...state.patients, patient] });
  return patient;
}

export function deletePatient(id) {
  const { [id]: _removed, ...readings } = state.readings;
  commit({ patients: state.patients.filter((p) => p.id !== id), readings });
}

export function addReading(patientKey, reading) {
  const list = [...(state.readings[patientKey] || []), reading].slice(-MAX_READINGS_PER_PATIENT);
  commit({ ...state, readings: { ...state.readings, [patientKey]: list } });
}

export function clearReadings(patientKey) {
  commit({ ...state, readings: { ...state.readings, [patientKey]: [] } });
}
