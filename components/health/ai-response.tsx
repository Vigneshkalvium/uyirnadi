"use client";
import { AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui";
import type { AIResult } from "@/types";
export function AIDisclaimer() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-[#e7ebdf] bg-[#f7f9f2] p-3 text-[11px] leading-relaxed text-[#879477]">
      <ShieldCheck className="mt-0.5 size-4 shrink-0" />
      <span>
        Informational guidance, not a diagnosis. UyirNadi does not replace a
        doctor or prescribe treatment. For an emergency, contact local emergency
        services immediately.
      </span>
    </div>
  );
}
export function AIResponse({ result }: { result: AIResult }) {
  return (
    <div className="space-y-5">
      {result.urgency && (
        <Badge
          tone={
            result.urgency === "Emergency"
              ? "red"
              : result.urgency === "Urgent medical attention"
                ? "amber"
                : "green"
          }
        >
          {result.urgency}
        </Badge>
      )}
      {result.emergencyWarning && (
        <div
          role="alert"
          className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertTriangle className="size-5 shrink-0" />
          <p>{result.emergencyWarning}</p>
        </div>
      )}
      <div>
        <h3 className="mb-2 flex items-center gap-2 font-semibold">
          <Sparkles className="size-4 text-primary" />
          Summary
        </h3>
        <div className="markdown">
          <ReactMarkdown>{result.summary}</ReactMarkdown>
        </div>
      </div>
      {result.interpretation && (
        <div>
          <h3 className="font-semibold">What this may mean</h3>
          <div className="markdown">
            <ReactMarkdown>{result.interpretation}</ReactMarkdown>
          </div>
        </div>
      )}
      {[
        { title: "Important observations", items: result.observations },
        { title: "What you can do next", items: result.nextSteps },
        {
          title: "Questions to discuss with your doctor",
          items: result.doctorQuestions,
        },
      ].map((s) =>
        s.items?.length ? (
          <section key={s.title}>
            <h3 className="mb-2 font-semibold">{s.title}</h3>
            <ul className="list-disc space-y-2 pl-4 text-xs leading-relaxed text-muted-foreground">
              {s.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null,
      )}
      {result.values?.length ? (
        <div className="table-wrap rounded-lg border border-border">
          <table className="data-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Value</th>
                <th>Document reference range</th>
                <th>Indicator</th>
              </tr>
            </thead>
            <tbody>
              {result.values.map((v, i) => (
                <tr key={i}>
                  <td>{v.name}</td>
                  <td>{v.value}</td>
                  <td>
                    {v.range ||
                      "Reference range not provided in the uploaded report."}
                  </td>
                  <td>
                    <Badge
                      tone={
                        /high|low|abnormal/i.test(v.flag) ? "amber" : "gray"
                      }
                    >
                      {v.flag || "Not determined"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {result.meals?.map((m, i) => (
        <div key={i} className="rounded-lg border border-border p-4">
          <p className="text-xs font-semibold text-primary">{m.meal}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {m.food}
          </p>
        </div>
      ))}
      {result.hydration && (
        <p className="text-sm">
          <strong>Hydration:</strong> {result.hydration}
        </p>
      )}
      <AIDisclaimer />
    </div>
  );
}
