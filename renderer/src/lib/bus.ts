const listeners = new Set<() => void>();

export function onAppDataChange(handler: () => void) {
  listeners.add(handler);
  return () => {
    listeners.delete(handler);
  };
}

export function emitAppDataChange() {
  listeners.forEach((handler) => handler());
}
