import { AdminManagement } from "@/components/health/admin-management";
export default function Page() {
  return (
    <AdminManagement
      collection="healthTips"
      title="Health education"
      description="Write, publish and manage helpful awareness content."
    />
  );
}
