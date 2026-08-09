import type { DBFieldAttribute } from "better-auth";

export const userAdditionalFields = {
  locale: {
    type: "string",
    required: false,
    input: true,
    defaultValue: "en",
  },
  theme: {
    type: "string",
    required: false,
    input: true,
    defaultValue: "system",
  },
} satisfies {
  [key: string]: DBFieldAttribute;
};

export const organizationAdditionalFields = {
  createdBy: {
    type: "string",
    required: false,
    input: false,
    references: { model: "user", field: "id", onDelete: "set null" },
  },
  isPersonal: {
    type: "boolean",
    required: false,
    input: false,
    defaultValue: false,
  },
} satisfies {
  [key: string]: DBFieldAttribute;
};
