import type { DBFieldAttribute } from "better-auth";

export const userAdditionalFields = {
  locale: {
    type: "string",
    required: false,
    input: true,
    defaultValue: "en",
  },
} satisfies {
  [key: string]: DBFieldAttribute;
};

export const organizationAdditionalFields = {
  createdBy: {
    type: "string",
    required: false,
    input: true,
    references: { model: "user", field: "id", onDelete: "set null" },
  },
} satisfies {
  [key: string]: DBFieldAttribute;
};
