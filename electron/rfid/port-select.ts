export type ListedPort = {
  path: string;
  manufacturer?: string;
  pnpId?: string;
  vendorId?: string;
  productId?: string;
  serialNumber?: string;
};

export function pathsEqual(a: string, b: string): boolean {
  const left = a.trim();
  const right = b.trim();
  if (!left || !right) return false;
  const bothCom =
    /^COM\d+$/i.test(left) && /^COM\d+$/i.test(right);
  return bothCom
    ? left.toUpperCase() === right.toUpperCase()
    : left === right;
}

export function isBlockedPort(port: ListedPort): boolean {
  const haystack =
    `${port.pnpId ?? ""} ${port.path ?? ""} ${port.manufacturer ?? ""}`.toUpperCase();
  return haystack.includes("BTHENUM") || haystack.includes("BLUETOOTH");
}

export function isLikelyUsbSerial(port: ListedPort): boolean {
  if (!port.path?.trim() || isBlockedPort(port)) return false;
  if (port.vendorId?.trim()) return true;
  const haystack =
    `${port.pnpId ?? ""} ${port.manufacturer ?? ""} ${port.path ?? ""}`.toUpperCase();
  return haystack.includes("USB");
}

export function findListedPort(
  ports: ListedPort[],
  path?: string | null
): ListedPort | undefined {
  const wanted = path?.trim();
  if (!wanted) return undefined;
  return ports.find((port) => pathsEqual(port.path, wanted));
}

/**
 * Only a port that is currently enumerated may be used.
 * A saved path that is missing from the live list is treated as disconnected.
 * Auto-select never falls back to Bluetooth or built-in COM ports without USB identity.
 */
export function pickRfidPort(
  ports: ListedPort[],
  preferred?: string | null
): ListedPort | undefined {
  const live = ports.filter((port) => port.path?.trim());
  const wanted = preferred?.trim();

  if (wanted) {
    return findListedPort(live, wanted);
  }

  return live.find(isLikelyUsbSerial);
}

export function isLiveRfidConnection(
  isOpen: boolean,
  path: string | null | undefined,
  ports: ListedPort[]
): boolean {
  if (!isOpen || !path?.trim()) return false;
  return Boolean(findListedPort(ports, path));
}

/** True when a USB device we opened has vanished from the live enumeration. */
export function usbIdentityLost(
  opened: ListedPort | null | undefined,
  current: ListedPort | undefined
): boolean {
  if (!opened) return false;
  if (!current) return true;
  if (opened.vendorId?.trim() && !current.vendorId?.trim()) return true;
  if (opened.serialNumber?.trim() && !current.serialNumber?.trim()) return true;
  return false;
}

export function preferredRfidPath(
  saved?: string | null,
  env?: string | null
): string {
  return saved?.trim() || env?.trim() || "";
}
