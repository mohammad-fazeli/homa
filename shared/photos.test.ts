import { describe, expect, it } from "vitest";
import {
  isPhotoKind,
  parsePhotoRequestUrl,
  photoDisplayUrl,
  photoFileName,
} from "./photos";

describe("photo urls", () => {
  it("builds a cache-busted custom protocol url", () => {
    expect(photoFileName("user", 12)).toBe("user-12.jpg");
    expect(photoDisplayUrl("instructor", 3, 99)).toBe(
      "homa-photo://instructor/3?v=99"
    );
  });

  it("parses only user and instructor ids", () => {
    expect(parsePhotoRequestUrl("homa-photo://user/12?v=1")).toEqual({
      kind: "user",
      id: 12,
    });
    expect(parsePhotoRequestUrl("homa-photo://instructor/4")).toEqual({
      kind: "instructor",
      id: 4,
    });
    expect(parsePhotoRequestUrl("homa-photo://user/0")).toBeNull();
    expect(parsePhotoRequestUrl("homa-photo://user/abc")).toBeNull();
    expect(parsePhotoRequestUrl("homa-photo://file/1")).toBeNull();
    expect(parsePhotoRequestUrl("https://user/1")).toBeNull();
    expect(isPhotoKind("user")).toBe(true);
    expect(isPhotoKind("room")).toBe(false);
  });
});
