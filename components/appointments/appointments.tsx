"use client";
import Image from "next/image";
import { useState } from "react";
import {
  Search,
  CalendarDays,
  Clock,
  ArrowRight,
  Stethoscope,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useRecords } from "@/hooks/use-records";
import { api, saveRecord, updateAppointment } from "@/lib/firestore/client";
import { firebaseConfigured } from "@/lib/firebase/client";
import { today, dateLabel, initials } from "@/lib/utils";
import {
  Button,
  Card,
  Badge,
  PageHeader,
  Input,
  Select,
  Field,
  Modal,
  EmptyState,
  ErrorState,
  LoadingCards,
} from "@/components/ui";
import type { RecordData } from "@/types";
export function Appointments({ doctorView = false }: { doctorView?: boolean }) {
  const doctors = useRecords("doctors");
  const appointments = useRecords("appointments");
  const [tab, setTab] = useState(doctorView ? "appointments" : "doctors");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All specialties");
  const [selected, setSelected] = useState<RecordData | null>(null);
  const [cancel, setCancel] = useState<RecordData | null>(null);
  const [details, setDetails] = useState<RecordData | null>(null);
  const [busy, setBusy] = useState(false);
  const results = doctors.records.filter(
    (d) =>
      `${d.name} ${d.specialization}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All specialties" || d.specialization === filter),
  );
  return (
    <>
      <PageHeader
        eyebrow="CONNECTED TO CARE"
        title={
          doctorView
            ? "Your appointments"
            : "The right care starts with a conversation"
        }
        description={
          doctorView
            ? "Manage your schedule and keep your patients informed."
            : "Find a healthcare professional and make time for your wellbeing."
        }
        action={
          !doctorView && (
            <Button onClick={() => setTab("appointments")} variant="outline">
              <CalendarDays />
              My appointments{" "}
              <Badge>
                {
                  appointments.records.filter(
                    (a) => a.status === "pending" || a.status === "confirmed",
                  ).length
                }
              </Badge>
            </Button>
          )
        }
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {!doctorView && (
          <Button
            variant={tab === "doctors" ? "secondary" : "ghost"}
            onClick={() => setTab("doctors")}
          >
            Find a doctor
          </Button>
        )}
        <Button
          variant={tab === "appointments" ? "secondary" : "ghost"}
          onClick={() => setTab("appointments")}
        >
          My appointments
        </Button>
      </div>
      {tab === "doctors" ? (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                aria-label="Search doctors"
                className="pl-10"
                placeholder="Search by doctor or specialty"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select
              className="sm:w-56"
              aria-label="Specialty"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option>All specialties</option>
              {Array.from(
                new Set(doctors.records.map((d) => String(d.specialization))),
              ).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </div>
          {doctors.loading ? (
            <LoadingCards />
          ) : doctors.error ? (
            <ErrorState message={doctors.error} retry={doctors.refresh} />
          ) : results.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {results.map((d) => (
                <Card key={d.id} className="p-6">
                  <div className="flex items-center gap-3">
                    {d.photo ? (
                      <Image
                        src={String(d.photo)}
                        alt="Doctor profile"
                        width={56}
                        height={56}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="flex size-14 items-center justify-center rounded-full bg-[#eaf0e1] text-primary">
                        {initials(String(d.name))}
                      </span>
                    )}
                    <div>
                      <h2>{String(d.name)}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {String(d.specialization)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-5 min-h-14 text-xs leading-relaxed text-muted-foreground">
                    {String(d.description)}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-[#82916f]">
                    <ShieldCheck className="size-3.5" />
                    {String(d.qualification)}
                  </div>
                  <div className="my-5 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-xs text-muted-foreground">
                      {Number(d.experience)} years of experience
                    </span>
                    <span className="text-sm font-medium">
                      ₹{Number(d.fee)}{" "}
                      <span className="text-[9px] font-normal text-muted-foreground">
                        / visit
                      </span>
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setSelected(d)}
                  >
                    View available slots
                    <ArrowRight />
                  </Button>
                  {d.id.startsWith("demo") && (
                    <p className="mt-3 text-center text-[9px] text-muted-foreground">
                      Demo profile · not a real provider
                    </p>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                title="No doctors found"
                description="Try another search, or check back as your care network grows."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setFilter("All specialties");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            </Card>
          )}
        </>
      ) : (
        <>
          <div className="mb-5">
            <Input
              aria-label="Search appointments"
              placeholder="Search doctor, patient or status"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {appointments.error && (
            <ErrorState
              message={appointments.error}
              retry={appointments.refresh}
            />
          )}
          <div className="space-y-4">
            {appointments.records
              .filter((a) =>
                `${a.doctorName} ${a.patientName} ${a.status}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((a) => (
                <Card
                  key={a.id}
                  className="flex flex-wrap items-center gap-5 p-6"
                >
                  <div className="rounded-xl bg-muted p-3">
                    <Stethoscope className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2>{String(doctorView ? a.patientName : a.doctorName)}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {String(a.specialization || "Consultation")}
                    </p>
                    <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                      <span className="flex gap-1">
                        <CalendarDays className="size-3.5" />
                        {dateLabel(String(a.date))}
                      </span>
                      <span className="flex gap-1">
                        <Clock className="size-3.5" />
                        {String(a.time)} IST
                      </span>
                    </div>
                  </div>
                  <Badge
                    tone={
                      a.status === "cancelled"
                        ? "red"
                        : a.status === "pending"
                          ? "amber"
                          : "green"
                    }
                  >
                    {String(a.status)}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetails(a)}
                    >
                      Details
                    </Button>
                    {doctorView && a.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await updateAppointment(a.id, "confirmed");
                            toast.success("Appointment confirmed.");
                          } catch (e) {
                            toast.error(
                              e instanceof Error
                                ? e.message
                                : "Could not update.",
                            );
                          }
                        }}
                      >
                        Confirm
                      </Button>
                    )}
                    {doctorView && a.status === "confirmed" && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await updateAppointment(a.id, "completed");
                            toast.success("Appointment completed.");
                          } catch (e) {
                            toast.error(
                              e instanceof Error
                                ? e.message
                                : "Could not update.",
                            );
                          }
                        }}
                      >
                        Complete
                      </Button>
                    )}
                    {["pending", "confirmed"].includes(String(a.status)) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancel(a)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            {appointments.records.length === 0 && (
              <Card>
                <EmptyState
                  title="No upcoming appointments"
                  description="Your next step toward better health starts here."
                  action={
                    <Button onClick={() => setTab("doctors")}>
                      Find a doctor
                    </Button>
                  }
                />
              </Card>
            )}
          </div>
        </>
      )}
      <Modal
        open={!!selected}
        onOpenChange={() => setSelected(null)}
        title="Make time for your health"
        description={
          selected ? `${selected.name} · ${selected.specialization}` : ""
        }
      >
        {selected && (
          <BookingForm
            doctor={selected}
            onDone={() => {
              setSelected(null);
              setTab("appointments");
            }}
          />
        )}
      </Modal>
      <Modal
        open={!!cancel}
        onOpenChange={() => setCancel(null)}
        title="Cancel this appointment?"
        description="The appointment slot will become available to other patients."
      >
        <Button
          variant="destructive"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await updateAppointment(cancel!.id, "cancelled");
              setCancel(null);
              toast.success("Appointment cancelled.");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Unable to cancel.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Cancel appointment
        </Button>
      </Modal>
      <Modal
        open={!!details}
        onOpenChange={() => setDetails(null)}
        title="Appointment details"
      >
        <div className="space-y-3 text-sm">
          <p>
            <strong>Doctor:</strong> {String(details?.doctorName)}
          </p>
          <p>
            <strong>Patient:</strong> {String(details?.patientName)}
          </p>
          <p>
            <strong>When:</strong> {String(details?.date)} at{" "}
            {String(details?.time)} IST
          </p>
          <p>
            <strong>Reason:</strong> {String(details?.reason || "Not provided")}
          </p>
          <p>
            <strong>Status:</strong> {String(details?.status)}
          </p>
          <p className="pt-3 text-xs text-muted-foreground">
            Contact your clinic for location and consultation instructions.
            Online video consultation is not included in this booking.
          </p>
        </div>
      </Modal>
    </>
  );
}
function BookingForm({
  doctor,
  onDone,
}: {
  doctor: RecordData;
  onDone: () => void;
}) {
  const slots = useRecords("availability", doctor.id);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const available = firebaseConfigured
    ? slots.records.filter(
        (s) => !s.blocked && !s.appointmentId && String(s.date) >= today(),
      )
    : [1, 2, 3, 4, 5].flatMap((offset) => {
        const d = new Date();
        d.setDate(d.getDate() + offset);
        return ["09:00", "10:30", "11:30", "14:00", "16:00"].map((time) => ({
          id: `demo-slot-${offset}-${time}`,
          date: d.toLocaleDateString("en-CA"),
          time,
        }));
      });
  const dates = Array.from(
    new Set(available.map((s) => String(s.date))),
  ).sort();
  async function book() {
    if (!date || !slot) {
      toast.error("Select a date and time.");
      return;
    }
    setBusy(true);
    try {
      const chosen = available.find((s) => s.id === slot)!;
      if (firebaseConfigured)
        await api("/api/appointments", {
          method: "POST",
          body: JSON.stringify({ doctorId: doctor.id, slotId: slot, reason }),
        });
      else
        await saveRecord("appointments", {
          doctorId: doctor.id,
          doctorName: doctor.name,
          specialization: doctor.specialization,
          userId: "demo",
          patientName: "Demo patient",
          date,
          time: chosen.time,
          status: "pending",
          reason,
          slotId: slot,
        });
      window.dispatchEvent(new Event("uyirnadi-data"));
      toast.success(
        firebaseConfigured
          ? "Appointment requested. Your doctor will confirm shortly."
          : "Demo appointment saved. No real booking was made.",
      );
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not book this slot.");
      await slots.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      {slots.error && (
        <ErrorState message={slots.error} retry={slots.refresh} />
      )}
      <Field label="Choose a date" htmlFor="booking-date">
        <Select
          id="booking-date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSlot("");
          }}
        >
          <option value="">Select an available date</option>
          {dates.map((d) => (
            <option value={d} key={d}>
              {dateLabel(d)}
            </option>
          ))}
        </Select>
      </Field>
      {date && (
        <div>
          <p className="mb-3 text-xs font-medium">
            Available times · India Standard Time
          </p>
          <div className="grid grid-cols-3 gap-2">
            {available
              .filter((s) => s.date === date)
              .map((s) => (
                <Button
                  key={s.id}
                  variant={slot === s.id ? "default" : "outline"}
                  onClick={() => setSlot(s.id)}
                >
                  {String(s.time)}
                </Button>
              ))}
          </div>
        </div>
      )}
      {!dates.length && !slots.loading && (
        <EmptyState
          title="No available slots yet"
          description="This doctor hasn’t published upcoming availability. Please check back."
        />
      )}
      <Field label="Reason for visit (optional)" htmlFor="reason">
        <Input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={1000}
          placeholder="Briefly tell your doctor how they can help"
        />
      </Field>
      <p className="text-xs text-muted-foreground">
        Only information relevant to your appointment is shared. Consultation
        fee: ₹{Number(doctor.fee)}. Payment is arranged with the clinic.
      </p>
      <Button onClick={book} disabled={busy || !slot} className="w-full">
        {busy
          ? "Requesting appointment..."
          : firebaseConfigured
            ? "Confirm appointment request"
            : "Confirm demo appointment"}
      </Button>
    </div>
  );
}
