import { AdminManagement } from "@/components/health/admin-management";
export default function Page() {
  return (
    <AdminManagement
      collection="feedback"
      title="Feedback inbox"
      description="Review the messages people send to the platform team."
    />
  );
}
