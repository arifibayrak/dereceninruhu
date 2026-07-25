import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Link from "next/link";

import { Button } from "./button";

/**
 * Düğme görünümlü bağlantılar gerçek bağlantı olarak kalmalı.
 *
 * base-ui'nin düğme makinesi `<button>` bekler. `render` yuvasına bağlantı
 * verildiğinde öntanım konsola uyarı yazar; `nativeButton={false}` ise elemana
 * `role="button"` ekler ve gezinen bağlantı ekran okuyucuda "düğme" diye
 * anons edilir. Button sarmalayıcısı bu yüzden bağlantı yuvasında base-ui'yi
 * hiç devreye sokmaz.
 */
describe("Button — bağlantı yuvası", () => {
  // Bu üç iddia iki ayrı yanlış uygulamayı da kırmızıya düşürür:
  //   base-ui öntanımı        → <a … type="button" tabindex="0">
  //   nativeButton={false}    → <a … role="button" tabindex="0">
  //   doğru olan (bypass)     → <a …> (fazladan öznitelik yok)
  it("<a> yuvasında gerçek bağlantı basar — role/type/tabindex eklemez", () => {
    const html = renderToStaticMarkup(
      <Button render={<a href="/x" />}>git</Button>,
    );
    expect(html).toMatch(/^<a /);
    expect(html).toContain('href="/x"');
    expect(html).not.toContain('role="button"'); // ekran okuyucu "düğme" demesin
    expect(html).not.toContain('type="button"'); // <a> üzerinde geçersiz
    expect(html).not.toContain("tabindex"); // <a href> zaten odaklanabilir
    expect(html).not.toContain("<button");
  });

  it("next/link yuvasında da gerçek bağlantı basar", () => {
    const html = renderToStaticMarkup(
      <Button render={<Link href="/x" />}>git</Button>,
    );
    expect(html).toMatch(/^<a /);
    expect(html).not.toContain('role="button"');
    expect(html).not.toContain('type="button"');
    expect(html).not.toContain("tabindex");
  });

  it("düğme stillerini bağlantıya taşır", () => {
    const html = renderToStaticMarkup(
      <Button variant="outline" size="sm" render={<a href="/x" />}>
        git
      </Button>,
    );
    expect(html).toContain("inline-flex");
    expect(html).toContain('data-slot="button"');
  });

  it("bağlantının kendi className'ini ezmez", () => {
    const html = renderToStaticMarkup(
      <Button className="w-fit" render={<a href="/x" className="mt-2" />}>
        git
      </Button>,
    );
    expect(html).toContain("mt-2");
    expect(html).toContain("w-fit");
  });

  it("aria-label ve onClick gibi propları bağlantıya geçirir", () => {
    const html = renderToStaticMarkup(
      <Button aria-label="Ana sayfa" render={<a href="/x" />}>
        git
      </Button>,
    );
    expect(html).toContain('aria-label="Ana sayfa"');
  });

  it("yuva yokken normal <button> basar", () => {
    const html = renderToStaticMarkup(<Button>kaydet</Button>);
    expect(html).toMatch(/^<button /);
    expect(html).toContain('type="button"');
  });
});
