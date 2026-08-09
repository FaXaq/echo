export default {
  "*.{js,jsx,ts,tsx,json,css}": (files) => {
    const formattable = files.filter((file) => !file.includes("packages/i18n/locales/"));
    return formattable.length ? [`oxfmt ${formattable.map((file) => `"${file}"`).join(" ")}`] : [];
  },
};
