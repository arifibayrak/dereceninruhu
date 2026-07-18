import { describe, expect, it } from "vitest";
import { parseTryToKurus } from "./format";

describe("parseTryToKurus", () => {
  it("parses plain integers", () => {
    expect(parseTryToKurus("2500")).toBe(250000);
    expect(parseTryToKurus("0")).toBe(0);
  });

  it("parses TR thousands format", () => {
    expect(parseTryToKurus("2.500")).toBe(250000);
    expect(parseTryToKurus("1.250.000")).toBe(125000000);
  });

  it("parses TR decimal comma", () => {
    expect(parseTryToKurus("2.500,50")).toBe(250050);
    expect(parseTryToKurus("99,9")).toBe(9990);
  });

  it("parses EN decimal dot", () => {
    expect(parseTryToKurus("2500.5")).toBe(250050);
  });

  it("strips currency decorations", () => {
    expect(parseTryToKurus("₺1.250,00 TL")).toBe(125000);
  });

  it("rejects garbage and negatives", () => {
    expect(parseTryToKurus("abc")).toBeNull();
    expect(parseTryToKurus("")).toBeNull();
    expect(parseTryToKurus("-5")).toBeNull();
  });
});
