import "server-only";
import { generateHealth } from "@/lib/ai/service";
import type { AIResult } from "@/types";
export interface OCRProvider {
  extract(
    file: { mimeType: string; data: string },
    kind: "prescription" | "report",
    instructions: string,
  ): Promise<AIResult>;
}
export class GeminiVisionOCR implements OCRProvider {
  extract(
    file: { mimeType: string; data: string },
    kind: "prescription" | "report",
    instructions: string,
  ) {
    return generateHealth(
      kind,
      `Read the attached document. Extract faithfully, flag uncertain fields. ${instructions}`,
      file,
    );
  }
}
export const ocr: OCRProvider = new GeminiVisionOCR();
