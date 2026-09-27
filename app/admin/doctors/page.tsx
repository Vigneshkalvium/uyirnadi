import { AdminManagement } from "@/components/health/admin-management";
export default function Page() {
  return (
    <AdminManagement
      collection="doctors"
      title="Care providers"
      description="Create and maintain clearly marked, verified provider profiles."
    />
  );
}
