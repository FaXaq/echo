export function formatDriveSearchLocation(path: string[]): string {
  if (path.length === 0) return "Drive";
  if (path.length <= 2) return path.join(" / ");
  return `${path[0]} / … / ${path[path.length - 1]}`;
}
