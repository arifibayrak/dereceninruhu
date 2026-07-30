import { describe, expect, it } from "vitest";

import {
  contentHref,
  contentTypeForFile,
  fileExtOf,
  formatFileSize,
  uploadExtFor,
  youtubeVideoId,
} from "./content";

describe("uploadExtFor", () => {
  it("MIME'dan uzantı bulur", () => {
    expect(uploadExtFor("application/pdf", "kitap.pdf")).toBe("pdf");
    expect(
      uploadExtFor(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "notlar.docx",
      ),
    ).toBe("docx");
  });

  it("MIME boş/geneldeyse dosya adına düşer", () => {
    expect(uploadExtFor("", "deneme.xlsx")).toBe("xlsx");
    expect(uploadExtFor("application/octet-stream", "ses.mp3")).toBe("mp3");
  });

  it("izinsiz türe null döner", () => {
    expect(uploadExtFor("application/x-msdownload", "virus.exe")).toBeNull();
    expect(uploadExtFor("", "arsiv.rar")).toBeNull();
  });
});

describe("contentTypeForFile", () => {
  it("dosyadan içerik türünü tahmin eder", () => {
    expect(contentTypeForFile("application/pdf", "a.pdf")).toBe("pdf");
    expect(contentTypeForFile("video/mp4", "ders.mp4")).toBe("video");
    expect(contentTypeForFile("", "ders.mov")).toBe("video");
    expect(contentTypeForFile("image/png", "ekran.png")).toBe("doc");
  });
});

describe("fileExtOf", () => {
  it("son uzantıyı küçük harf döner", () => {
    expect(fileExtOf("Konu Anlatimi.PDF")).toBe("pdf");
    expect(fileExtOf("uzantisiz")).toBe("");
  });
});

describe("formatFileSize", () => {
  it("TR biçiminde okunur boyut verir", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(2_411_724)).toBe("2,3 MB");
  });
});

describe("contentHref", () => {
  it("yüklenen dosya bağlantıyı ezer", () => {
    expect(
      contentHref({ url: "https://x.com/a", fileKey: "content/abc.pdf" }),
    ).toBe("/api/uploads/content/abc.pdf");
    expect(contentHref({ url: "https://x.com/a", fileKey: null })).toBe(
      "https://x.com/a",
    );
    expect(contentHref({ url: null })).toBeNull();
  });
});

describe("youtubeVideoId", () => {
  it("watch/youtu.be/shorts biçimlerini çözer", () => {
    expect(youtubeVideoId("https://youtu.be/abc123xyz")).toBe("abc123xyz");
    expect(youtubeVideoId("https://www.youtube.com/watch?v=abc123xyz")).toBe(
      "abc123xyz",
    );
    expect(youtubeVideoId("https://example.com/video")).toBeNull();
  });
});
