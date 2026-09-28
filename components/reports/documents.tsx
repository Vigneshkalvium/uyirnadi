"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Check,
  Download,
  FileText,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { allowedFileTypes, maxFileSize } from "@/lib/validation";
import { firebaseConfigured } from "@/lib/firebase/client";
import { api, deleteRecord, saveRecord } from "@/lib/firestore/client";
import { useRecords } from "@/hooks/use-records";
import { dateLabel } from "@/lib/utils";
import { AIResponse } from "@/components/health/ai-response";
import { hardcodedPrescriptionResult } from "@/lib/ai/hardcoded";
import {
  Badge,
  Button,
  Busy,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Field,
  Modal,
  PageHeader,
} from "@/components/ui";
import type { AIResult, RecordData } from "@/types";

type Uploaded = { storagePath: string; name: string; mimeType: string };

export function Documents({
  prescription = false,
}: {
  prescription?: boolean;
}) {
  const collection = prescription ? "prescriptions" : "healthReports";
  const data = useRecords(collection);
  const appointments = useRecords("appointments");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [uploaded, setUploaded] = useState<Uploaded | null>(null);
  const [result, setResult] = useState<AIResult | null>(null);
  const [consent, setConsent] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<RecordData | null>(null);
  const [removal, setRemoval] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string>();
  const [sampleExtraction, setSampleExtraction] = useState(false);

  useEffect(() => {
    if (!file) return setPreview("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function choose(next?: File) {
    if (!next) return;
    if (
      !allowedFileTypes.includes(next.type) ||
      !next.size ||
      next.size > maxFileSize
    )
      return toast.error("Choose a PDF, JPG or PNG smaller than 8 MB.");
    setFile(next);
    setUploaded(null);
    setResult(null);
    setConsent(false);
    setConfirmed(false);
    setError("");
    setSavedId(undefined);
    setSampleExtraction(false);
  }

  async function upload() {
    if (!file) return;
    if (!firebaseConfigured)
      return setError(
        "Private uploads need a connected Firebase project. This file has not left your browser.",
      );
    setBusy("Uploading securely...");
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", prescription ? "prescriptions" : "health-reports");
      const saved = await api<Uploaded>("/api/upload", {
        method: "POST",
        body: form,
      });
      setUploaded(saved);
      if (!prescription) {
        const record = await saveRecord("healthReports", {
          ...saved,
          sharedWith: [],
        });
        setSavedId(record.id);
      }
      toast.success("Document uploaded to your private storage.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setBusy("");
    }
  }

  async function analyze() {
    if (prescription) {
      setBusy("Loading the sample extraction...");
      setError("");
      await new Promise((resolve) => setTimeout(resolve, 250));
      setResult(hardcodedPrescriptionResult);
      setSampleExtraction(true);
      setBusy("");
      return;
    }
    if (!uploaded || !consent) return;
    setBusy("Reading your document...");
    setError("");
    try {
      const response = await api<{ result: AIResult }>(
        `/api/ai/${prescription ? "prescription" : "report"}`,
        {
          method: "POST",
          body: JSON.stringify({
            storagePath: uploaded.storagePath,
            consent: true,
            prompt: prescription
              ? "Faithfully extract medicine, dose, frequency, duration and instructions. Mark uncertainty low confidence."
              : "Extract values and reference ranges only where present; explain in simple, cautious language.",
          }),
        },
      );
      setResult(response.result);
      if (!prescription)
        await saveRecord(
          "healthReports",
          {
            ...uploaded,
            analysis: response.result,
            sharedWith: [],
          },
          savedId,
        );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis failed.");
    } finally {
      setBusy("");
    }
  }

  function loadSampleExtraction() {
    setResult(hardcodedPrescriptionResult);
    setSampleExtraction(true);
    setConfirmed(false);
    setError("");
  }

  async function savePrescription() {
    if (
      (!uploaded && !sampleExtraction) ||
      !result?.medicines?.length ||
      !confirmed
    )
      return;
    if (result.medicines.some((m) => !m.name.trim())) {
      toast.error("Enter a medicine name, or mark it as unclear.");
      return;
    }
    setBusy("Saving your confirmation...");
    try {
      await saveRecord("prescriptions", {
        ...(uploaded || {
          name: "Prescription extraction sample — not a clinical record",
        }),
        medicines: result.medicines,
        confirmed: true,
        ...(sampleExtraction ? { sample: true } : {}),
      });
      toast.success(
        sampleExtraction
          ? "Sample prescription saved to your workspace."
          : "Confirmed prescription saved.",
      );
      setFile(null);
      setUploaded(null);
      setResult(null);
      setSampleExtraction(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save prescription.",
      );
    } finally {
      setBusy("");
    }
  }

  const filtered = data.records.filter((record) =>
    String(record.name).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow={
          prescription ? "FROM PAPER TO CLARITY" : "YOUR HEALTH, IN ONE PLACE"
        }
        title={
          prescription
            ? "Make sense of your prescription"
            : "Your health documents"
        }
        description={
          prescription
            ? "Extract medicine details, verify every field, and keep a clear record."
            : "A private home for your reports, with simple explanations when you need them."
        }
      />
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-2">
            {prescription ? (
              <ScanLine className="size-5 text-primary" />
            ) : (
              <Upload className="size-5 text-primary" />
            )}
            <h2>
              {prescription
                ? "Upload a prescription"
                : "Upload a health report"}
            </h2>
          </div>
          <label
            className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#cdd7c0] bg-[#f7f9f2] p-6 text-center hover:bg-[#f0f4e9]"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              choose(event.dataTransfer.files[0]);
            }}
          >
            <span className="mb-4 rounded-xl bg-white p-3">
              <Upload className="size-6 text-[#8b9e75]" />
            </span>
            <span className="text-sm font-medium">
              {file?.name || "Drop a document here"}
            </span>
            <span className="mt-2 text-xs text-muted-foreground">
              PDF, JPG or PNG · up to 8 MB
            </span>
            <input
              className="sr-only"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={(event) => choose(event.target.files?.[0])}
            />
          </label>
          {preview && (
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              {file?.type === "application/pdf" ? (
                <iframe
                  title="Selected PDF preview"
                  src={preview}
                  className="h-56 w-full"
                />
              ) : (
                <div className="relative h-56">
                  <Image
                    src={preview}
                    alt="Selected document"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              )}
            </div>
          )}
          <p className="mt-4 flex gap-2 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0" />
            Your document is private. You decide whether it may be sent to the
            AI provider.
          </p>
          {prescription && !result && (
            <Button
              variant="outline"
              className="mt-4 w-full"
              disabled={Boolean(busy)}
              onClick={loadSampleExtraction}
            >
              <Sparkles />
              Try a hardcoded sample extraction
            </Button>
          )}
          {file && !uploaded && (
            <Button
              className="mt-5 w-full"
              disabled={Boolean(busy)}
              onClick={upload}
            >
              {busy ? (
                <Busy>{busy}</Busy>
              ) : (
                <>
                  <Upload />
                  Upload securely
                </>
              )}
            </Button>
          )}
          {uploaded && (
            <>
              <Badge>
                <Check className="size-3" />
                Uploaded securely
              </Badge>
              <label className="mt-4 flex gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                />
                {prescription
                  ? "I understand this view shows a hardcoded sample and does not read my uploaded document."
                  : "I agree to send this document to Gemini for informational analysis."}
              </label>
              <Button
                className="mt-4 w-full"
                disabled={!consent || Boolean(busy)}
                onClick={analyze}
              >
                {busy ? (
                  <Busy>{busy}</Busy>
                ) : (
                  <>
                    <Sparkles />
                    {prescription ? "Show sample extraction" : "Analyze report"}
                  </>
                )}
              </Button>
            </>
          )}
          {error && (
            <div className="mt-4">
              <ErrorState message={error} retry={uploaded ? analyze : upload} />
            </div>
          )}
        </Card>
        <Card className="p-6">
          {result ? (
            prescription ? (
              <>
                <h2>
                  {sampleExtraction
                    ? "Hardcoded sample extraction"
                    : "AI extracted information"}
                </h2>
                <p className="my-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  {sampleExtraction
                    ? "This is a sample only. It was not read from your uploaded document. Replace every field with the exact wording from an original prescription before saving."
                    : "Please verify this information against the original prescription. OCR results are not medically verified."}
                </p>
                <div className="space-y-3">
                  {result.medicines?.map((medicine, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="flex justify-between">
                        <strong className="text-sm">
                          {medicine.name || "Unclear medicine"}
                        </strong>
                        <Badge
                          tone={
                            medicine.confidence === "high" ? "gray" : "amber"
                          }
                        >
                          {medicine.confidence}
                        </Badge>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {(
                          [
                            "name",
                            "dosage",
                            "frequency",
                            "duration",
                            "instructions",
                          ] as const
                        ).map((key) => (
                          <Field
                            key={key}
                            label={key.charAt(0).toUpperCase() + key.slice(1)}
                            htmlFor={`medicine-${index}-${key}`}
                          >
                            <Input
                              id={`medicine-${index}-${key}`}
                              value={medicine[key]}
                              onChange={(event) => {
                                setConfirmed(false);
                                setResult({
                                  ...result,
                                  medicines: result.medicines!.map(
                                    (value, i) =>
                                      i === index
                                        ? {
                                            ...value,
                                            [key]: event.target.value,
                                          }
                                        : value,
                                  ),
                                });
                              }}
                            />
                          </Field>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {!result.medicines?.length && (
                  <p role="status" className="my-4 text-sm text-amber-800">
                    No readable medicines were found. Try a clearer image of the
                    complete prescription; nothing has been saved.
                  </p>
                )}
                <label className="mt-5 flex gap-2 text-xs">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                  />
                  I have checked every detail against the original prescription.
                </label>
                <Button
                  className="mt-4"
                  disabled={
                    !confirmed || Boolean(busy) || !result.medicines?.length
                  }
                  onClick={savePrescription}
                >
                  <Check />
                  {sampleExtraction
                    ? "Save confirmed sample"
                    : "Save confirmed prescription"}
                </Button>
              </>
            ) : (
              <AIResponse result={result} />
            )
          ) : (
            <EmptyState
              icon={prescription ? ScanLine : FileText}
              title={
                prescription
                  ? "Clarity, one detail at a time"
                  : "Your report, in plain language"
              }
              description={
                prescription
                  ? "You can review the extraction before anything is saved."
                  : "Upload a report to get a cautious, informational summary."
              }
            />
          )}
        </Card>
      </div>
      <section className="mt-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2>
            {prescription
              ? "Your saved prescriptions"
              : "Your document library"}
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              className="pl-10"
              aria-label="Search documents"
              placeholder="Find a document"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        {data.error && <ErrorState message={data.error} retry={data.refresh} />}
        <Card>
          {filtered.length ? (
            filtered.map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-3 border-b border-border p-5 last:border-0"
              >
                <span className="rounded-lg bg-[#f7eee9] p-2.5">
                  <FileText className="size-5 text-[#bda38b]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {String(record.name)}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {dateLabel(record.createdAt || new Date().toISOString())} ·{" "}
                    {Boolean(record.demo) ? "Demo document" : "Private"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setView(record)}
                >
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete document"
                  onClick={() => setRemoval(record.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))
          ) : (
            <EmptyState
              title={
                prescription
                  ? "No prescriptions saved yet"
                  : "No health reports yet"
              }
              description="Upload your first document above."
            />
          )}
        </Card>
      </section>
      <Modal
        open={Boolean(view)}
        onOpenChange={() => setView(null)}
        title={String(view?.name || "Document")}
        description={
          Boolean(view?.demo || view?.sample)
            ? "Sample document only."
            : "Your private health document."
        }
      >
        {!prescription && view && (
          <div className="mb-5 space-y-3 rounded-lg border border-border p-4">
            <h3>Share with your doctor</h3>
            <p className="text-xs text-muted-foreground">
              Only doctors with confirmed appointments appear here.
            </p>
            {Array.from(
              new Map(
                appointments.records
                  .filter((a) =>
                    ["confirmed", "completed"].includes(String(a.status)),
                  )
                  .map((a) => [String(a.doctorId), a]),
              ).values(),
            ).map((a) => (
              <label key={String(a.doctorId)} className="flex gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={
                    Array.isArray(view.sharedWith) &&
                    view.sharedWith.includes(a.doctorId)
                  }
                  onChange={async (event) => {
                    const share = event.target.checked;
                    try {
                      await api("/api/reports/share", {
                        method: "POST",
                        body: JSON.stringify({
                          reportId: view.id,
                          doctorId: a.doctorId,
                          share,
                        }),
                      });
                      setView({
                        ...view,
                        sharedWith: share
                          ? [
                              ...(Array.isArray(view.sharedWith)
                                ? view.sharedWith
                                : []),
                              a.doctorId,
                            ]
                          : (Array.isArray(view.sharedWith)
                              ? view.sharedWith
                              : []
                            ).filter((id) => id !== a.doctorId),
                      });
                      await data.refresh();
                      toast.success(
                        share
                          ? "Report shared with doctor."
                          : "Sharing removed.",
                      );
                    } catch (e) {
                      toast.error(
                        e instanceof Error
                          ? e.message
                          : "Could not update sharing.",
                      );
                    }
                  }}
                />
                {String(a.doctorName)}
              </label>
            ))}
          </div>
        )}
        {Boolean(view?.storagePath) && (
          <Button asChild variant="outline" className="mb-5">
            <a
              href={`/api/upload?path=${encodeURIComponent(String(view?.storagePath))}`}
              target="_blank"
              rel="noreferrer"
            >
              <Download />
              Open original document
            </a>
          </Button>
        )}
        {Array.isArray(view?.medicines) ? (
          <div className="space-y-3">
            {(view.medicines as NonNullable<AIResult["medicines"]>).map(
              (medicine, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border p-4"
                >
                  <h3 className="font-semibold">{medicine.name}</h3>
                  <p className="mt-2 text-sm">
                    {medicine.dosage} · {medicine.frequency} ·{" "}
                    {medicine.duration}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {medicine.instructions}
                  </p>
                </div>
              ),
            )}
          </div>
        ) : view?.analysis ? (
          <AIResponse result={view.analysis as AIResult} />
        ) : (
          <EmptyState
            title="No saved analysis"
            description="The original document remains private."
          />
        )}
      </Modal>
      <Modal
        open={Boolean(removal)}
        onOpenChange={() => setRemoval(null)}
        title="Delete this document?"
        description="This action cannot be undone from the application."
      >
        <Button
          variant="destructive"
          onClick={async () => {
            try {
              await deleteRecord(collection, removal!);
              setRemoval(null);
              toast.success("Document deleted.");
            } catch {
              toast.error("Could not delete document.");
            }
          }}
        >
          Delete document
        </Button>
      </Modal>
    </>
  );
}
