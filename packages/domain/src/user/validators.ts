import { z } from "zod";

export const passwordSchema = z.string().superRefine((val, ctx) => {
  const add = (message: string) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, message });

  if (val.length < 12) add("Au moins 12 caractères");
  if (val.length > 72) add("Maximum 72 caractères");
  if (!/[A-Z]/.test(val)) add("Au moins une majuscule");
  if (!/[a-z]/.test(val)) add("Au moins une minuscule");
  if (!/[0-9]/.test(val)) add("Au moins un chiffre");
  if (!/[^A-Za-z0-9]/.test(val)) add("Au moins un caractère spécial");
});

export const validators = {
  passwordSchema,
  validatePassword: (password: string) =>
    passwordSchema.safeParse(password).success,
};
