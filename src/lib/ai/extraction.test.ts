import { describe, expect, it } from "vitest";
import { parseExtraction } from "./extraction";

describe("parseExtraction", () => {
  it("parses a clean JSON object", () => {
    const out = parseExtraction(
      JSON.stringify({
        digest: "Matematik denemesi konuşuldu.",
        proposals: [
          {
            kind: "question_log_upsert",
            sourceQuote: "Salı 120 soru",
            payload: {
              logDate: "2026-07-14",
              entries: [{ subjectId: 12, questionCount: 120 }],
            },
          },
        ],
      }),
    );
    expect(out).not.toBeNull();
    expect(out?.proposals).toHaveLength(1);
    expect(out?.proposals[0].kind).toBe("question_log_upsert");
  });

  it("strips markdown code fences", () => {
    const text =
      "```json\n" +
      JSON.stringify({ digest: "x", proposals: [] }) +
      "\n```";
    expect(parseExtraction(text)?.proposals).toEqual([]);
  });

  it("ignores prose around the JSON object", () => {
    const text =
      "İşte sonuç:\n" +
      JSON.stringify({ digest: "y", proposals: [] }) +
      "\nUmarım yardımcı olur.";
    expect(parseExtraction(text)?.digest).toBe("y");
  });

  it("returns null for non-JSON", () => {
    expect(parseExtraction("Üzgünüm, bir şey bulamadım.")).toBeNull();
  });

  it("returns null when the JSON violates the schema (bad kind)", () => {
    const text = JSON.stringify({
      digest: "z",
      proposals: [{ kind: "drop_table", payload: {} }],
    });
    expect(parseExtraction(text)).toBeNull();
  });
});
