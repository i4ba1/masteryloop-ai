import { z } from "zod";

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1, "Enter your password.").max(128),
});

export const createClassSchema = z.object({
  name: z.string().trim().min(2).max(80),
  subject: z.literal("Science"),
  gradeLevel: z.enum(["P3", "P4", "P5", "P6"]),
  teacherId: z.uuid(),
});

export const membershipSchema = z.object({
  classId: z.uuid(),
  studentId: z.uuid(),
  active: z.boolean(),
});

export const guardianLinkSchema = z.object({
  parentId: z.uuid(),
  studentId: z.uuid(),
  active: z.boolean(),
});

export interface ActionState {
  success: boolean;
  message: string;
  requestId?: string;
}

export const initialActionState: ActionState = { success: false, message: "" };

export const dashboardQuerySchema = z.object({
  classesAfter: z.uuid().optional(),
  peopleAfter: z.uuid().optional(),
});
export const accountDetailsSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
  role: z.enum(["STUDENT", "PARENT", "TEACHER", "ADMIN"]),
  gradeLevel: z.enum(["P3", "P4", "P5", "P6"]),
  schoolYear: z.coerce.number().int().min(2020).max(2100),
});
export const createAccountSchema = accountDetailsSchema.extend({
  requestId: z.uuid(),
  email: z
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
});
export const updateAccountSchema = accountDetailsSchema.extend({
  accountId: z.uuid(),
  expectedVersion: z.coerce.number().int().min(1),
  active: z.boolean(),
  reason: z.string().trim().min(5).max(500),
});

export const gradingResultSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    score: z.number().finite().nonnegative(),
    maxScore: z.number().finite().positive(),
    confidence: z.number().finite().min(0).max(1),
    criteria: z
      .array(
        z
          .object({
            criterionId: z.string().min(1).max(100),
            awarded: z.number().finite().nonnegative(),
            possible: z.number().finite().positive(),
            met: z.boolean(),
            evidence: z.string().max(1000),
          })
          .strict(),
      )
      .max(50),
    misconceptions: z.array(z.string().max(300)).max(20),
    studentFeedback: z.string().min(1).max(2000),
    reviewFlags: z.array(z.string().max(100)).max(20),
  })
  .strict();
export type GradingResultContract = z.infer<typeof gradingResultSchema>;
