"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRecords } from "@/hooks/use-records";
import { deleteRecord, saveRecord } from "@/lib/firestore/client";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PageHeader,
} from "@/components/ui";
import { RecordForm, type FormField } from "@/components/forms/record-form";
import type { CollectionName, RecordData } from "@/types";

type ManagedCollection =
  "doctors" | "healthTips" | "emergencyContacts" | "feedback" | "users";

const formFields: Record<
  "doctors" | "healthTips" | "emergencyContacts",
  FormField[]
> = {
  doctors: [
    { name: "name", label: "Name", required: true },
    { name: "specialization", label: "Specialization", required: true },
    { name: "qualification", label: "Qualification", required: true },
    {
      name: "experience",
      label: "Experience (years)",
      type: "number",
      min: 0,
      max: 70,
    },
    { name: "fee", label: "Consultation fee (₹)", type: "number", min: 0 },
    {
      name: "description",
      label: "Profile description",
      type: "textarea",
      required: true,
    },
    { name: "active", label: "Visible to patients", type: "checkbox" },
  ],
  healthTips: [
    { name: "title", label: "Title", required: true },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: [
        "Nutrition",
        "Fitness",
        "Preventive Care",
        "Mental Wellness",
        "General Health",
        "Medicine Safety",
      ],
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: true,
    },
    { name: "image", label: "Image URL (optional)" },
    { name: "published", label: "Publish now", type: "checkbox" },
  ],
  emergencyContacts: [
    { name: "name", label: "Service name", required: true },
    { name: "phone", label: "Phone number", required: true },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: ["Emergency", "Hospital", "Ambulance", "Police", "Other"],
      required: true,
    },
    { name: "region", label: "Region", required: true },
  ],
};

export function AdminManagement({
  collection,
  title,
  description,
}: {
  collection: ManagedCollection;
  title: string;
  description: string;
}) {
  const data = useRecords(collection);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<RecordData | true | null>(null);
  const [removal, setRemoval] = useState<string | null>(null);
  const editable =
    collection === "doctors" ||
    collection === "healthTips" ||
    collection === "emergencyContacts";
  const editing = form && typeof form === "object" ? form : undefined;
  const records = useMemo(
    () =>
      data.records.filter((record) =>
        JSON.stringify(record).toLowerCase().includes(query.toLowerCase()),
      ),
    [data.records, query],
  );
  const defaults =
    collection === "doctors"
      ? { active: true, experience: 0, fee: 0 }
      : collection === "healthTips"
        ? { published: false, category: "General Health" }
        : { category: "Emergency" };

  return (
    <>
      <PageHeader
        eyebrow="PLATFORM MANAGEMENT"
        title={title}
        description={description}
        action={
          editable ? (
            <Button onClick={() => setForm(true)}>
              <Plus />
              Add new
            </Button>
          ) : undefined
        }
      />
      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input
          className="pl-10"
          aria-label={`Search ${title}`}
          placeholder={`Search ${title.toLowerCase()}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {data.error && <ErrorState message={data.error} retry={data.refresh} />}
      <Card>
        {records.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="font-medium">
                      {String(
                        record.name ||
                          record.title ||
                          record.email ||
                          "Submission",
                      )}
                    </td>
                    <td className="max-w-80 truncate">
                      {String(
                        record.specialization ||
                          record.category ||
                          record.message ||
                          record.phone ||
                          record.role ||
                          "—",
                      )}
                    </td>
                    <td>
                      <Badge
                        tone={
                          record.published === false || record.active === false
                            ? "amber"
                            : "green"
                        }
                      >
                        {record.published === false
                          ? "Draft"
                          : record.active === false
                            ? "Inactive"
                            : String(record.status || "Active")}
                      </Badge>
                    </td>
                    <td>
                      {editable ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setForm(record)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Delete record"
                            onClick={() => setRemoval(record.id)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            toast.info(
                              "Use the secure review workflow for details.",
                            )
                          }
                        >
                          View
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={`No ${title.toLowerCase()} yet`}
            description="New records will appear here when they are available."
          />
        )}
      </Card>
      {editable && (
        <Modal
          open={Boolean(form)}
          onOpenChange={() => setForm(null)}
          title={
            editing ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`
          }
        >
          <RecordForm
            fields={formFields[collection]}
            initial={editing ?? defaults}
            onSubmit={async (values) => {
              await saveRecord(
                collection as CollectionName,
                values,
                editing?.id,
              );
              setForm(null);
              toast.success("Changes saved.");
            }}
          />
        </Modal>
      )}
      <Modal
        open={Boolean(removal)}
        onOpenChange={() => setRemoval(null)}
        title="Delete this record?"
        description="This action cannot be undone from the application."
      >
        <Button
          variant="destructive"
          onClick={async () => {
            try {
              await deleteRecord(collection as CollectionName, removal!);
              setRemoval(null);
              toast.success("Record deleted.");
            } catch {
              toast.error("Unable to delete record.");
            }
          }}
        >
          Delete record
        </Button>
      </Modal>
    </>
  );
}
