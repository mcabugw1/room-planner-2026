let _next = Date.now();

export function createId(): number {
  return _next++;
}
