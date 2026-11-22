import Dexie from "dexie";

export const db = new Dexie("ClinicDB");

db.version(1).stores({
  patients: "++id, name, phone, createdAt",
  // visits: id (auto-increment), patientId (foreign key index), date, prescriptionText, transcript
  visits: "++id, patientId, date",
});
