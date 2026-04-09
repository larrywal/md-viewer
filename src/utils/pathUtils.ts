export function shortenPath(relativePath: string): string {
  const segments = relativePath.split("/");
  if (segments.length <= 4) return relativePath;
  return `${segments[0]}/.../${segments.slice(-2).join("/")}`;
}
