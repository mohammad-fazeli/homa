import crypto from "crypto";

export function hashPin(pin: string) {
  return crypto.createHash("sha256").update(`homa:${pin.trim()}`).digest("hex");
}

export function publicSettings<T extends { lockPinHash?: string }>(settings: T) {
  const { lockPinHash: _hidden, ...rest } = settings;
  return rest;
}
