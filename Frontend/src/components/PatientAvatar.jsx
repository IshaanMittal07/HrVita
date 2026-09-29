import { User } from "lucide-react";

export default function PatientAvatar({ patient, size = "h-16 w-16" }) {
  if (patient?.photo) {
    return <img src={patient.photo} alt={patient.name} className={`${size} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <div className={`${size} flex shrink-0 items-center justify-center rounded-full bg-blue-600 text-white`}>
      <User className="h-1/2 w-1/2" />
    </div>
  );
}
