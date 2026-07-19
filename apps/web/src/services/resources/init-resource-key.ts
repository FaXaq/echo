/**
 * TanStack Query key helpers for resource modules.
 */
export function initResourceKey<R extends string>(resource: R) {
  const key = [{ _resource: resource }] as const;

  function getResourceKey<I extends string, P extends object | undefined>(id: I, params: P) {
    return [{ _resource: resource, _id: id, params }] as const;
  }

  return { key, getResourceKey };
}
