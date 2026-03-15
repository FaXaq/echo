import { base } from "@echo/config/eslint.base";

export default [
  ...base,
  {
    rules: {
      "no-console": "off",
    },
  },
];
