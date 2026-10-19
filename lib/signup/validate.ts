export interface AccountInput {
  name: string;
  email: string;
  password: string;
}

export type FieldName = keyof AccountInput;

/** Codes are the keys of `dictionary.flow.errors`, so a message always exists in both locales. */
export type ErrorCode =
  | "nameRequired"
  | "emailRequired"
  | "emailFormat"
  | "passwordRequired"
  | "passwordShort";

export type FieldErrors = Partial<Record<FieldName, ErrorCode>>;

export const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates the three account fields. Returns only the fields that are wrong. */
export function validateAccount(input: Readonly<AccountInput>): FieldErrors {
  const errors: { -readonly [K in FieldName]?: ErrorCode } = {};

  if (input.name.trim() === "") errors.name = "nameRequired";

  const email = input.email.trim();
  if (email === "") errors.email = "emailRequired";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "emailFormat";

  if (input.password === "") errors.password = "passwordRequired";
  else if ([...input.password].length < MIN_PASSWORD_LENGTH) errors.password = "passwordShort";

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Field order in the form, used to order the error summary. */
export const fieldOrder: readonly FieldName[] = ["name", "email", "password"];
