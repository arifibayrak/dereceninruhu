import { describe, expect, it } from "vitest";

import {
  UPLOAD_CHUNK_BYTES,
  chunkCountFor,
  contentHref,
  contentTypeForFile,
  fileExtOf,
  formatFileSize,
  isContentKey,
  needsMultipart,
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

const MB = 1024 * 1024;

describe("needsMultipart", () => {
  it("parça boyutunun altındaki dosya tek istekle gider", () => {
    expect(needsMultipart(10 * MB)).toBe(false);
    expect(needsMultipart(UPLOAD_CHUNK_BYTES)).toBe(false);
  });

  it("parça boyutunu aşan dosya parçalanır", () => {
    expect(needsMultipart(UPLOAD_CHUNK_BYTES + 1)).toBe(true);
    expect(needsMultipart(128 * MB)).toBe(true);
  });
});

describe("chunkCountFor", () => {
  it("128 MB'ı 50'şer MB'lık 3 parçaya böler (50+50+28)", () => {
    expect(chunkCountFor(128 * MB)).toBe(3);
  });

  it("tam bölünen boyutta fazladan parça açmaz", () => {
    expect(chunkCountFor(UPLOAD_CHUNK_BYTES * 2)).toBe(2);
  });

  it("küçük dosyada tek parça", () => {
    expect(chunkCountFor(1)).toBe(1);
    expect(chunkCountFor(0)).toBe(1);
  });

  it("üst sınırda R2'nin 10.000 parça limitini aşmaz", () => {
    expect(chunkCountFor(250 * MB)).toBeLessThan(10_000);
  });
});

describe("isContentKey", () => {
  it("yalnız content/<uuid>.<uzantı> kabul eder", () => {
    const key = "content/0f8fad5b-d9cb-469f-a165-70867728950e.pdf";
    expect(isContentKey(key)).toBe(true);
  });

  it("başka önek ya da yol kaçışı reddedilir", () => {
    expect(isContentKey("transcripts/0f8fad5b-d9cb-469f-a165-70867728950e.mp3")).toBe(false);
    expect(isContentKey("content/../secret.pdf")).toBe(false);
    expect(isContentKey("content/evil.pdf")).toBe(false);
    expect(isContentKey("")).toBe(false);
  });
});
