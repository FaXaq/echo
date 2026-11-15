export function formatDriveSearchLocation(path: string[], driveLabel = "Drive"): string {
  if (path.length === 0) return driveLabel;
  if (path.length <= 2) return path.join(" / ");
  return `${path[0]} / … / ${path[path.length - 1]}`;
}
