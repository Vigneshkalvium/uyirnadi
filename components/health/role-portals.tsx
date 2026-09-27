"use client";

import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useRecords } from "@/hooks/use-records";
import { saveRecord, updateAppointment } from "@/lib/firestore/client";
import { today, dateLabel } from "@/lib/utils";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  Badge,
} from "@/components/ui";
import { RecordForm } from "@/components/forms/record-form";
import type { RecordData } from "@/types";

export function DoctorDashboard() {
  const appointments = useRecords("appointments");
  const availability = useRecords("availability");
  const upcoming = appointments.records.filter(
    (item) => item.status === "pending" || item.status === "confirmed",
  );
  const todayAppointments = upcoming.filter((item) => item.date === today());
  return (
    <>
      <PageHeader
        eyebrow="DOCTOR WORKSPACE"
        title="A calmer day of care"
        description="Appointments, availability and patient context in one private workspace."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Today’s appointments"
          value={todayAppointments.length}
          icon={CalendarDays}
        />
        <Metric
          label="Upcoming appointments"
          value={upcoming.length}
          icon={Clock3}
        />
        <Metric
          label="Published slots"
          value={availability.records.filter((item) => !item.blocked).length}
          icon={CheckCircle2}
        />
      </div>
      <Card className="mt-5">
        <div className="p-5">
          <h2>Today’s schedule</h2>
        </div>
        {todayAppointments.length ? (
          <AppointmentRows records={todayAppointments} doctor />
        ) : (
          <EmptyState
            title="A little breathing room today"
            description="There are no confirmed appointments for today."
          />
        )}
      </Card>
      <p className="mt-5 text-xs text-muted-foreground">
        Patient reports are available only where the patient has explicitly
        shared them with you.
      </p>
    </>
  );
}

export function DoctorAvailability() {
  const records = useRecords("availability");
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageHeader
        eyebrow="DOCTOR WORKSPACE"
        title="Make time for care"
        description="Set future appointment times or block a date when you are unavailable."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Add availability
          </Button>
        }
      />
      {records.error && (
        <ErrorState message={records.error} retry={records.refresh} />
      )}
      <Card>
        {records.records.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.records.map((record) => (
                  <tr key={record.id}>
                    <td>{dateLabel(String(record.date))}</td>
                    <td>{String(record.time)} IST</td>
                    <td>
                      <Badge
                        tone={
                          record.blocked
                            ? "red"
                            : record.appointmentId
                              ? "amber"
                              : "green"
                        }
                      >
                        {record.blocked
                          ? "Blocked"
                          : record.appointmentId
                            ? "Booked"
                            : "Available"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No availability published"
            description="Add a future slot to start accepting appointment requests."
            action={<Button onClick={() => setOpen(true)}>Add a time</Button>}
          />
        )}
      </Card>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add a care slot"
        description="Patients will only see unblocked future slots."
      >
        <RecordForm
          fields={[
            { name: "date", label: "Date", type: "date", required: true },
            { name: "time", label: "Time", type: "time", required: true },
            {
              name: "blocked",
              label: "Block this time instead",
              type: "checkbox",
            },
          ]}
          initial={{ date: today(), time: "09:00", blocked: false }}
          onSubmit={async (values) => {
            await saveRecord("availability", values);
            setOpen(false);
            toast.success("Availability saved.");
          }}
          submitLabel="Save availability"
        />
      </Modal>
    </>
  );
}

export function RoleAppointments({ admin = false }: { admin?: boolean }) {
  const records = useRecords("appointments");
  const [query, setQuery] = useState("");
  const filtered = records.records.filter((record) =>
    `${record.doctorName} ${record.patientName} ${record.status}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow={admin ? "PLATFORM MANAGEMENT" : "DOCTOR WORKSPACE"}
        title={admin ? "Appointments across care" : "Appointments"}
        description={
          admin
            ? "Review operational status across the platform."
            : "Review and manage your patient appointments."
        }
      />
      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input
          className="pl-10"
          aria-label="Search appointments"
          placeholder="Search appointments"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {records.error && (
        <ErrorState message={records.error} retry={records.refresh} />
      )}
      <Card>
        {filtered.length ? (
          <AppointmentRows records={filtered} doctor={!admin} />
        ) : (
          <EmptyState
            title="No appointments match"
            description="Try a different name or status."
          />
        )}
      </Card>
    </>
  );
}

function AppointmentRows({
  records,
  doctor = false,
}: {
  records: RecordData[];
  doctor?: boolean;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Doctor</th>
            <th>When</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{String(record.patientName || "—")}</td>
              <td>{String(record.doctorName || "—")}</td>
              <td>
                {dateLabel(String(record.date))} · {String(record.time)}
              </td>
              <td>
                <Badge
                  tone={
                    record.status === "pending"
                      ? "amber"
                      : record.status === "cancelled"
                        ? "red"
                        : "green"
                  }
                >
                  {String(record.status)}
                </Badge>
              </td>
              <td>
                {doctor && record.status === "pending" ? (
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                            await updateAppointment(record.id,'confirmed');
                        toast.success("Appointment confirmed.");
                      } catch {
                        toast.error("Unable to update appointment.");
                      }
                    }}
                  >
                    Confirm
                  </Button>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminDashboard() {
  const users = useRecords("users");
  const doctors = useRecords("doctors");
  const appointments = useRecords("appointments");
  const reports = useRecords("healthReports");
  return (
    <>
      <PageHeader
        eyebrow="PLATFORM MANAGEMENT"
        title="Care, at a glance"
        description="A private operational view of the UyirNadi workspace."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total users" value={users.records.length} icon={Users} />
        <Metric
          label="Active doctors"
          value={doctors.records.filter((item) => item.active).length}
          icon={ShieldCheck}
        />
        <Metric
          label="Appointments"
          value={appointments.records.length}
          icon={CalendarDays}
        />
        <Metric
          label="Reports uploaded"
          value={reports.records.length}
          icon={FileText}
        />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2>Appointment status</h2>
          <div className="mt-6 space-y-4">
            {["pending", "confirmed", "completed", "cancelled"].map(
              (status) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="capitalize text-sm">{status}</span>
                  <Badge
                    tone={
                      status === "pending"
                        ? "amber"
                        : status === "cancelled"
                          ? "red"
                          : "green"
                    }
                  >
                    {
                      appointments.records.filter(
                        (item) => item.status === status,
                      ).length
                    }
                  </Badge>
                </div>
              ),
            )}
          </div>
        </Card>
        <Card className="p-6">
          <BarChart3 className="mb-4 size-6 text-primary" />
          <h2>Responsible data access</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Admin analytics use aggregate platform records. Do not use this
            space to inspect medical document contents without a documented
            operational need and authorization.
          </p>
        </Card>
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
    </Card>
  );
}
