import type { AIResult } from "@/types";

const emergencyWords = [
  "chest pain",
  "shortness of breath",
  "cannot breathe",
  "can't breathe",
  "faint",
  "unconscious",
  "severe bleeding",
  "suicide",
  "self harm",
];

export function hardcodedHealthResponse(question: string): AIResult {
  const text = question.toLowerCase();
  if (emergencyWords.some((word) => text.includes(word))) {
    return {
      urgency: "Emergency",
      summary:
        "Your message includes words that can indicate an emergency. This guide cannot assess an emergency safely online.",
      interpretation:
        "Seek immediate emergency care or call your local emergency number now. If you can, ask someone nearby to stay with you.",
      observations: [
        "Do not wait for more chat guidance if symptoms are sudden, severe, or worsening.",
        "Avoid driving yourself if you feel faint, confused, severely unwell, or have serious breathing difficulty.",
      ],
      nextSteps: [
        "Contact emergency services or go to the nearest emergency department now.",
        "Use the Emergency Contacts page to view configured local contact information.",
      ],
      doctorQuestions: [],
      emergencyWarning:
        "This is an emergency-safety response, not a diagnosis. Get urgent in-person help now.",
    };
  }

  if (/(sleep|insomnia|tired|fatigue|rest)/.test(text)) {
    return {
      summary:
        "A consistent sleep routine can support energy and wellbeing. This is a general guide, not an assessment of the cause of sleep problems.",
      interpretation:
        "Sleep can be affected by routine, stress, caffeine, activity, light exposure, illness, and many other factors.",
      observations: [
        "Persistent tiredness or sleep changes deserve a conversation with a clinician.",
        "Snoring with pauses in breathing, severe daytime sleepiness, or sudden worsening should be discussed promptly with a doctor.",
      ],
      nextSteps: [
        "Try a regular sleep and wake time for several days.",
        "Reduce bright screens, caffeine, and heavy meals close to bedtime if those affect you.",
        "Keep a brief sleep note: bedtime, wake time, naps, caffeine, and how you feel the next day.",
      ],
      doctorQuestions: [
        "Could any health condition or regular medicine be affecting my sleep?",
        "What changes should make me book an appointment sooner?",
      ],
    };
  }

  if (/(report|test|blood|result|range|lab)/.test(text)) {
    return {
      summary:
        "A report result is best understood together with the test name, its reference range shown on the report, symptoms, and your clinician’s assessment.",
      interpretation:
        "A single number often cannot confirm a condition by itself. Different laboratories can use different reference ranges.",
      observations: [
        "Do not assume a result is normal or abnormal if the original report does not provide a reference range.",
        "Use the Report Upload page for a document-based informational summary after the real AI/OCR service is configured.",
      ],
      nextSteps: [
        "Keep the original report available and note the test date.",
        "Write down symptoms, medicines, and questions to take to your appointment.",
      ],
      doctorQuestions: [
        "What does this result mean in my situation?",
        "Do I need a repeat test, monitoring, or any follow-up?",
      ],
    };
  }

  if (/(check-up|checkup|appointment|doctor|prepare)/.test(text)) {
    return {
      summary:
        "A little preparation can make a doctor appointment more useful and easier to remember.",
      interpretation:
        "The doctor can make better decisions when they know your main concern, timeline, regular medicines, allergies, and relevant past records.",
      observations: [
        "It helps to focus on the one or two issues that matter most to you.",
        "A symptom timeline is often more useful than trying to remember every detail during the appointment.",
      ],
      nextSteps: [
        "Write your top questions in order of importance.",
        "Bring your current medicine list and relevant health reports.",
        "Note when symptoms began, what changes them, and whether they are improving or worsening.",
      ],
      doctorQuestions: [
        "What could be causing this and what should I monitor?",
        "When should I return or seek more urgent care?",
      ],
    };
  }

  if (/(fever|cough|cold|sore throat|headache|stomach|nausea)/.test(text)) {
    return {
      summary:
        "Common symptoms such as a mild cough, headache, sore throat, or stomach discomfort can have many possible causes. This guide cannot tell which cause applies to you.",
      interpretation:
        "Rest, fluids, and monitoring may be reasonable for mild, improving symptoms, unless a clinician has given you different instructions.",
      observations: [
        "Worsening symptoms, persistent fever, trouble breathing, dehydration, severe pain, or symptoms lasting longer than expected need medical advice.",
        "Do not change prescribed medicines based on this response.",
      ],
      nextSteps: [
        "Use the Symptom Checker for a structured non-diagnostic next-step guide.",
        "Rest, drink fluids if you can, and keep a note of symptom timing and severity.",
        "Book a doctor appointment if symptoms persist, recur, or affect daily activities.",
      ],
      doctorQuestions: [
        "What warning signs should I watch for?",
        "Do I need an examination or test if this does not improve?",
      ],
    };
  }

  return {
    summary:
      "I am currently using a prewritten health-information guide. I can help you prepare questions and point you to the right UyirNadi tool, but I cannot diagnose a condition.",
    interpretation:
      "For personalised analysis, the Gemini integration must be configured by the platform owner. Until then, this assistant provides safe general guidance only.",
    observations: [
      "For urgent, severe, or worsening symptoms, contact a qualified professional rather than relying on a chat response.",
      "Avoid sharing passwords, financial details, or other unnecessary personal information in chat.",
    ],
    nextSteps: [
      "Use Symptom Checker for a structured urgency guide.",
      "Use Nutrition Planner for a general meal template.",
      "Book an appointment if you need individual medical advice.",
    ],
    doctorQuestions: [
      "What information should I bring to discuss this concern?",
      "What changes should make me seek care sooner?",
    ],
  };
}

export const hardcodedPrescriptionResult: AIResult = {
  summary:
    "This is a prefilled example extraction for trying the prescription review screen. It was not read from your uploaded file and is not medical advice.",
  medicines: [
    {
      name: "Sample medicine A — example only",
      dosage: "Example dosage field",
      frequency: "Example frequency field",
      duration: "Example duration field",
      instructions:
        "Replace every field with the exact wording from an original prescription before saving.",
      confidence: "unclear",
    },
    {
      name: "Sample medicine B — example only",
      dosage: "Example dosage field",
      frequency: "Example frequency field",
      duration: "Example duration field",
      instructions:
        "Do not start, stop, or change medicine based on this sample.",
      confidence: "unclear",
    },
  ],
};
