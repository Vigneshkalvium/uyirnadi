"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Select, Textarea, Field, Button, Busy } from "@/components/ui";
import { toast } from "sonner";
export type FormField = {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "number"
    | "date"
    | "time"
    | "textarea"
    | "select"
    | "checkbox"
    | "password";
  options?: string[];
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number | string;
};
export function RecordForm({
  fields,
  onSubmit,
  initial = {},
  submitLabel = "Save changes",
}: {
  fields: FormField[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  initial?: Record<string, unknown>;
  submitLabel?: string;
}) {
  const shape: Record<string, z.ZodType> = {};
  fields.forEach((f) => {
    shape[f.name] =
      f.type === "checkbox"
        ? z.boolean()
        : f.type === "number"
          ? z.coerce
              .number()
              .min(f.min ?? 0)
              .max(f.max ?? 100000)
          : f.type === "email"
            ? z.email()
            : f.required
              ? z.string().trim().min(1, `${f.label} is required`)
              : z.string().max(10000).optional();
  });
  const schema = z.object(shape);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: initial });
  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        try {
          await onSubmit(data);
        } catch (e) {
          toast.error(
            e instanceof Error
              ? e.message
              : "Unable to save. Please try again.",
          );
        }
      })}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div
            key={f.name}
            className={f.type === "textarea" ? "sm:col-span-2" : ""}
          >
            <Field
              label={f.label}
              htmlFor={`field-${f.name}`}
              error={errors[f.name]?.message?.toString()}
            >
              {f.type === "select" ? (
                <Select id={`field-${f.name}`} {...register(f.name)}>
                  <option value="">Select {f.label.toLowerCase()}</option>
                  {f.options?.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea
                  id={`field-${f.name}`}
                  placeholder={f.placeholder}
                  {...register(f.name)}
                />
              ) : (
                <Input
                  id={`field-${f.name}`}
                  type={f.type || "text"}
                  step={f.step || "any"}
                  min={f.min}
                  max={f.max}
                  placeholder={f.placeholder}
                  {...register(f.name)}
                  className={
                    f.type === "checkbox" ? "!size-5 accent-primary" : ""
                  }
                />
              )}
            </Field>
          </div>
        ))}
      </div>
      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? <Busy>Saving...</Busy> : submitLabel}
      </Button>
    </form>
  );
}
