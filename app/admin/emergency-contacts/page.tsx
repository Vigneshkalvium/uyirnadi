import { AdminManagement } from "@/components/health/admin-management";
export default function Page() {
  return (
    <AdminManagement
      collection="emergencyContacts"
      title="Emergency contacts"
      description="Maintain verified local service details for the emergency page."
    />
  );
}
