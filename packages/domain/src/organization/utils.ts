export const generateSlug = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, "-");
};
