import { z } from "zod";

export const createAccountSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.email().transform((value) => value.toLowerCase()),
    role: z.enum(["user", "doctor", "admin"]),
    password: z.string().min(12).max(128),
    phone: z.string().max(25).optional(),
    specialization: z.string().trim().max(100).optional(),
    qualification: z.string().trim().max(200).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.role === "doctor" && !value.specialization)
      ctx.addIssue({
        code: "custom",
        path: ["specialization"],
        message: "Enter a specialization.",
      });
  });
