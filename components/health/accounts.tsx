"use client";
import { useState } from "react";
import {
  Plus,
  Search,
  UserRound,
  Stethoscope,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useRecords } from "@/hooks/use-records";
import { api } from "@/lib/firestore/client";
import { RecordForm } from "@/components/forms/record-form";
import {
  Button,
  Card,
  PageHeader,
  Input,
  Modal,
  Badge,
  EmptyState,
  ErrorState,
  LoadingCards,
} from "@/components/ui";
import type { RecordData } from "@/types";

export function Accounts() {
  const data = useRecords("users");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [add, setAdd] = useState<"user" | "doctor" | "admin" | null>(null);
  const [selected, setSelected] = useState<RecordData | null>(null);
  const [change, setChange] = useState<RecordData | null>(null);
  const [busy, setBusy] = useState(false);
  const records = data.records.filter(
    (r) =>
      (role === "all" || r.role === role) &&
      `${r.name} ${r.email}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow="PEOPLE & ACCESS"
        title="Your care community"
        description="Add patients, doctors and administrators. Roles are assigned securely by the server."
      />
      <div className="mb-6 flex flex-wrap gap-3">
        {(
          [
            { role: "user", name: "patient", Icon: UserRound },
            { role: "doctor", name: "doctor", Icon: Stethoscope },
            { role: "admin", name: "administrator", Icon: ShieldCheck },
          ] as const
        ).map((item) => (
          <Button
            key={item.role}
            onClick={() => setAdd(item.role)}
            variant={item.role === "user" ? "default" : "outline"}
          >
            <item.Icon />
            Add {item.name}
            <Plus />
          </Button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            aria-label="Search people"
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email on this page"
          />
        </div>
        <select
          className="input !w-auto"
          aria-label="Filter account role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="all">All roles</option>
          <option value="user">Patients</option>
          <option value="doctor">Doctors</option>
          <option value="admin">Administrators</option>
        </select>
      </div>
      {data.error && <ErrorState message={data.error} retry={data.refresh} />}
      {data.loading ? (
        <LoadingCards />
      ) : (
        <Card>
          {records.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td>
                        {String(r.name)}
                        {Boolean(r.demo) && (
                          <span className="ml-2">
                            <Badge tone="gray">Sample</Badge>
                          </span>
                        )}
                      </td>
                      <td>{String(r.email)}</td>
                      <td>{r.role === "user" ? "Patient" : String(r.role)}</td>
                      <td>
                        <Badge tone={r.disabled ? "red" : "green"}>
                          {r.disabled ? "Disabled" : "Active"}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelected(r)}
                          >
                            Details
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setChange(r)}
                          >
                            {r.disabled ? "Enable" : "Disable"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No matching accounts"
              description="Add a person above or change your filters."
            />
          )}
        </Card>
      )}
      {data.hasMore && (
        <Button onClick={data.loadMore} className="mt-4" variant="outline">
          Load more accounts
        </Button>
      )}
      <Modal
        open={!!add}
        onOpenChange={() => setAdd(null)}
        title={`Add ${add === "user" ? "patient" : add === "admin" ? "administrator" : "doctor"}`}
        description="Use an email address the person owns. Share the temporary password securely; no email is sent automatically."
      >
        <RecordForm
          key={add || "closed"}
          fields={[
            { name: "name", label: "Full name", required: true },
            {
              name: "email",
              label: "Email address",
              type: "email",
              required: true,
            },
            { name: "phone", label: "Phone (optional)" },
            {
              name: "password",
              label: "Temporary password (12+ characters)",
              type: "password",
              required: true,
            },
            ...(add === "doctor"
              ? [
                  {
                    name: "specialization",
                    label: "Specialization",
                    required: true,
                  },
                  { name: "qualification", label: "Qualifications" },
                ]
              : []),
          ]}
          onSubmit={async (values) => {
            await api("/api/accounts", {
              method: "POST",
              body: JSON.stringify({ ...values, role: add }),
            });
            setAdd(null);
            await data.refresh();
            toast.success("Account created. The person can now sign in.");
          }}
          submitLabel="Create account"
        />
      </Modal>
      <Modal
        open={!!selected}
        onOpenChange={() => setSelected(null)}
        title={String(selected?.name || "Account")}
        description="Account details"
      >
        <dl className="space-y-3 text-sm">
          {["email", "role", "phone", "createdAt"].map((key) => (
            <div className="flex flex-wrap justify-between gap-2" key={key}>
              <dt className="capitalize text-muted-foreground">{key}</dt>
              <dd>{String(selected?.[key] || "Not provided")}</dd>
            </div>
          ))}
        </dl>
      </Modal>
      <Modal
        open={!!change}
        onOpenChange={() => setChange(null)}
        title={`${change?.disabled ? "Enable" : "Disable"} this account?`}
        description="Disabling prevents sign-in and revokes existing sessions. Records are retained."
      >
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await api("/api/accounts", {
                method: "PATCH",
                body: JSON.stringify({
                  id: change!.id,
                  disabled: !change!.disabled,
                }),
              });
              setChange(null);
              await data.refresh();
              toast.success("Account status updated.");
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Unable to update account.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          Confirm
        </Button>
      </Modal>
    </>
  );
}
