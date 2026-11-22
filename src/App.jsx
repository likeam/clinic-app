// src/App.jsx
import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { db } from "./db";
import VoiceInput from "./components/VoiceInput";

function App() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [prescription, setPrescription] = useState("");
  const [newPatientName, setNewPatientName] = useState("");
  const printRef = useRef(null);

  // Load patient list
  useEffect(() => {
    db.patients.toArray().then(setPatients);
  }, []);

  // Load visit history when patient is selected
  useEffect(() => {
    if (!selectedPatient) return setVisits([]);
    db.visits
      .where("patientId")
      .equals(selectedPatient.id)
      .reverse()
      .sortBy("date")
      .then(setVisits);
  }, [selectedPatient]);

  const addPatient = async () => {
    if (!newPatientName.trim()) return;
    const id = await db.patients.add({
      name: newPatientName.trim(),
      createdAt: new Date(),
    });
    const p = await db.patients.get(id);
    setPatients((prev) => [...prev, p]);
    setSelectedPatient(p);
    setNewPatientName("");
  };

  const saveVisit = async () => {
    if (!selectedPatient || !prescription.trim()) return;
    await db.visits.add({
      patientId: selectedPatient.id,
      prescriptionText: prescription,
      date: new Date(),
    });
    // Refresh history
    const updated = await db.visits
      .where("patientId")
      .equals(selectedPatient.id)
      .reverse()
      .sortBy("date");
    setVisits(updated);
    setPrescription("");
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Prescription-${selectedPatient?.name || "patient"}`,
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {/* Left: Patient List */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-bold text-lg mb-3">Patients</h2>
          <div className="flex gap-2 mb-3">
            <input
              className="border rounded px-2 py-1 flex-1 text-sm"
              placeholder="New patient name"
              value={newPatientName}
              onChange={(e) => setNewPatientName(e.target.value)}
            />
            <button
              onClick={addPatient}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm"
            >
              Add
            </button>
          </div>
          <ul className="space-y-1 max-h-60 overflow-auto">
            {patients.map((p) => (
              <li
                key={p.id}
                onClick={() => setSelectedPatient(p)}
                className={`cursor-pointer px-3 py-2 rounded text-sm ${
                  selectedPatient?.id === p.id
                    ? "bg-blue-100 font-medium"
                    : "hover:bg-gray-100"
                }`}
              >
                {p.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Middle: Prescription Input */}
        <div className="bg-white rounded-lg shadow p-4 md:col-span-2">
          <h2 className="font-bold text-lg mb-3">
            {selectedPatient
              ? `Prescription · ${selectedPatient.name}`
              : "Select a patient first"}
          </h2>

          <VoiceInput
            onTranscript={(text) =>
              setPrescription((prev) => prev + " " + text)
            }
          />

          <textarea
            className="w-full border rounded p-3 mt-3 h-40 text-sm"
            placeholder="Prescription content (can be voice input or typed manually)..."
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
          />

          <div className="flex gap-2 mt-3">
            <button
              onClick={saveVisit}
              disabled={!selectedPatient || !prescription.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Save Visit
            </button>
            <button
              onClick={handlePrint}
              disabled={!prescription.trim()}
              className="bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Print Prescription
            </button>
          </div>

          {/* Hidden print area */}
          <div style={{ display: "none" }}>
            <div ref={printRef} className="p-8">
              <h1 className="text-2xl font-bold text-center mb-2">
                Prescription
              </h1>
              <p className="text-sm mb-4">Patient: {selectedPatient?.name}</p>
              <p className="text-sm mb-4">
                Date: {new Date().toLocaleDateString()}
              </p>
              <div className="border-t pt-4 whitespace-pre-wrap">
                {prescription}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Visit History */}
        {selectedPatient && (
          <div className="bg-white rounded-lg shadow p-4 md:col-span-3">
            <h2 className="font-bold text-lg mb-3">
              Visit History · {selectedPatient.name}
            </h2>
            {visits.length === 0 ? (
              <p className="text-gray-500 text-sm">No visit records yet</p>
            ) : (
              <ul className="space-y-3">
                {visits.map((v) => (
                  <li key={v.id} className="border-l-4 border-blue-500 pl-3">
                    <p className="text-xs text-gray-500">
                      {new Date(v.date).toLocaleString()}
                    </p>
                    <p className="text-sm whitespace-pre-wrap mt-1">
                      {v.prescriptionText}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
