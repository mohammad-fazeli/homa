import { describe, expect, it } from "vitest";
import {
  findListedPort,
  isBlockedPort,
  isLikelyUsbSerial,
  isLiveRfidConnection,
  pathsEqual,
  pickRfidPort,
  preferredRfidPath,
  usbIdentityLost,
} from "./port-select";

const com1 = { path: "COM1", manufacturer: "(Standard port types)" };
const bluetooth = {
  path: "COM5",
  manufacturer: "Microsoft Bluetooth",
  pnpId: "BTHENUM\\{00001101}",
};
const usbReader = {
  path: "COM3",
  manufacturer: "wch.cn",
  vendorId: "1A86",
  productId: "7523",
  pnpId: "USB\\VID_1A86&PID_7523\\5&123",
};
const usbNoVid = {
  path: "COM7",
  manufacturer: "USB Serial Device",
  pnpId: "USB\\VID_10C4&PID_EA60\\X",
};

describe("pathsEqual", () => {
  it("treats Windows COM paths as case-insensitive", () => {
    expect(pathsEqual("com3", "COM3")).toBe(true);
    expect(pathsEqual("COM3", "COM4")).toBe(false);
  });

  it("keeps unix device paths case-sensitive", () => {
    expect(pathsEqual("/dev/ttyUSB0", "/dev/ttyUSB0")).toBe(true);
    expect(pathsEqual("/dev/ttyUSB0", "/dev/ttyusb0")).toBe(false);
  });
});

describe("port classification", () => {
  it("blocks bluetooth enumerations", () => {
    expect(isBlockedPort(bluetooth)).toBe(true);
    expect(isLikelyUsbSerial(bluetooth)).toBe(false);
  });

  it("does not treat a built-in COM port as a USB reader", () => {
    expect(isLikelyUsbSerial(com1)).toBe(false);
  });

  it("recognizes USB serial by vendor id or USB pnp id", () => {
    expect(isLikelyUsbSerial(usbReader)).toBe(true);
    expect(isLikelyUsbSerial(usbNoVid)).toBe(true);
  });
});

describe("pickRfidPort", () => {
  it("never invents a saved port that is not in the live list", () => {
    expect(pickRfidPort([com1], "COM3")).toBeUndefined();
    expect(pickRfidPort([], "COM3")).toBeUndefined();
  });

  it("uses the saved port only when it is currently listed", () => {
    expect(pickRfidPort([com1, usbReader], "COM3")).toEqual(usbReader);
    expect(pickRfidPort([usbReader], "com3")).toEqual(usbReader);
  });

  it("allows an explicit saved port even if it is not USB", () => {
    expect(pickRfidPort([com1, usbReader], "COM1")).toEqual(com1);
  });

  it("auto-selects a USB serial device and ignores COM1 and bluetooth", () => {
    expect(pickRfidPort([bluetooth, com1, usbReader])).toEqual(usbReader);
    expect(pickRfidPort([com1, bluetooth])).toBeUndefined();
    expect(pickRfidPort([])).toBeUndefined();
  });

  it("does not fall back to the first random port", () => {
    expect(pickRfidPort([bluetooth])).toBeUndefined();
    expect(pickRfidPort([com1])).toBeUndefined();
  });
});

describe("isLiveRfidConnection", () => {
  it("is online only when the handle is open and the path is still listed", () => {
    expect(isLiveRfidConnection(true, "COM3", [usbReader])).toBe(true);
    expect(isLiveRfidConnection(true, "COM3", [com1])).toBe(false);
    expect(isLiveRfidConnection(true, "COM3", [])).toBe(false);
    expect(isLiveRfidConnection(false, "COM3", [usbReader])).toBe(false);
    expect(isLiveRfidConnection(true, "", [usbReader])).toBe(false);
    expect(isLiveRfidConnection(true, null, [usbReader])).toBe(false);
  });
});

describe("preferredRfidPath", () => {
  it("prefers saved settings over the env fallback", () => {
    expect(preferredRfidPath(" COM3 ", "COM9")).toBe("COM3");
    expect(preferredRfidPath("  ", "COM9")).toBe("COM9");
    expect(preferredRfidPath(undefined, undefined)).toBe("");
  });
});

describe("findListedPort", () => {
  it("matches the live entry for a path", () => {
    expect(findListedPort([usbReader, com1], "COM3")).toEqual(usbReader);
    expect(findListedPort([usbReader], "COM9")).toBeUndefined();
  });
});

describe("usbIdentityLost", () => {
  it("detects a USB reader that lost its vendor id after unplug", () => {
    expect(usbIdentityLost(usbReader, { path: "COM3" })).toBe(true);
    expect(usbIdentityLost(usbReader, usbReader)).toBe(false);
    expect(usbIdentityLost(usbReader, undefined)).toBe(true);
    expect(usbIdentityLost(null, com1)).toBe(false);
  });
});
