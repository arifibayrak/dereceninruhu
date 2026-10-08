/**
 * OG kapak + apple-icon üreticisi (yazım anında bir kez Node'da çalıştırılır).
 * Next ile gelen @vercel/og + Geist TTF (latin-ext → Türkçe glifler) kullanır;
 * böylece Worker çalışma zamanında resvg.wasm paketlemez / render etmez.
 *
 * Çalıştır:  node scripts/generate-og.cjs
 * Çıktılar:  public/og.png (1200×630), src/app/apple-icon.png (180×180)
 */
const fs = require("fs");
const path = require("path");
const React = require("react");
const { ImageResponse } = require("next/dist/compiled/@vercel/og");

const ROOT = path.join(__dirname, "..");
const FDIR = path.join(ROOT, "node_modules/geist/dist/fonts/geist-sans");
const regular = fs.readFileSync(path.join(FDIR, "Geist-Regular.ttf"));
const semibold = fs.readFileSync(path.join(FDIR, "Geist-SemiBold.ttf"));
const bold = fs.readFileSync(path.join(FDIR, "Geist-Bold.ttf"));
const fonts = [
  { name: "Geist", data: regular, weight: 400, style: "normal" },
  { name: "Geist", data: semibold, weight: 600, style: "normal" },
  { name: "Geist", data: bold, weight: 700, style: "normal" },
];
const h = React.createElement;

function bars(unit) {
  return h(
    "div",
    { style: { display: "flex", alignItems: "flex-end", gap: unit * 0.9 } },
    h("div", { style: { width: unit, height: unit * 1.8, borderRadius: 99, background: "rgba(255,255,255,0.4)" } }),
    h("div", { style: { width: unit, height: unit * 3.0, borderRadius: 99, background: "rgba(255,255,255,0.66)" } }),
    h("div", { style: { width: unit, height: unit * 4.4, borderRadius: 99, background: "#ffffff" } }),
  );
}

function badge(size) {
  const unit = size * 0.12;
  return h(
    "div",
    {
      style: {
        width: size,
        height: size,
        borderRadius: size * 0.26,
        background: "linear-gradient(135deg,#6f46ea,#47219f)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: size * 0.2,
        position: "relative",
      },
    },
    bars(unit),
    h("div", {
      style: {
        position: "absolute",
        top: size * 0.14,
        right: size * 0.16,
        width: size * 0.16,
        height: size * 0.16,
        background: "#f2c14e",
        transform: "rotate(45deg)",
        borderRadius: size * 0.03,
      },
    }),
  );
}

const ogTree = h(
  "div",
  {
    style: {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      background: "linear-gradient(135deg,#38207b 0%,#241452 100%)",
      padding: 80,
      fontFamily: "Geist",
    },
  },
  h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 22 } },
    badge(72),
    h("div", { style: { display: "flex", fontSize: 36, fontWeight: 700, color: "#fff" } }, "Derecenin Ruhu"),
  ),
  h(
    "div",
    { style: { display: "flex", flexDirection: "column" } },
    h("div", { style: { display: "flex", fontSize: 78, fontWeight: 700, color: "#fff", lineHeight: 1.05 } }, "Netlerini artır,"),
    h("div", { style: { display: "flex", fontSize: 78, fontWeight: 700, color: "#f0c04e", lineHeight: 1.05 } }, "hedefine ulaş."),
    h("div", { style: { display: "flex", fontSize: 33, color: "rgba(255,255,255,0.78)", marginTop: 26 } }, "LGS · YKS · KPSS · Birebir online sınav koçluğu"),
  ),
  h(
    "div",
    { style: { display: "flex", alignItems: "center", fontSize: 27, color: "rgba(255,255,255,0.62)" } },
    "4,9 / 5 yıldız   ·   91 yorum   ·   dereceninruhu.com",
  ),
);

const appleTree = h(
  "div",
  {
    style: {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      background: "linear-gradient(135deg,#6f46ea,#47219f)",
      paddingBottom: 34,
      position: "relative",
    },
  },
  bars(20),
  h("div", {
    style: {
      position: "absolute",
      top: 26,
      right: 30,
      width: 30,
      height: 30,
      background: "#f2c14e",
      transform: "rotate(45deg)",
      borderRadius: 6,
    },
  }),
);

async function png(tree, width, height) {
  const res = new ImageResponse(tree, { width, height, fonts });
  return Buffer.from(await res.arrayBuffer());
}

(async () => {
  fs.writeFileSync(path.join(ROOT, "public/og.png"), await png(ogTree, 1200, 630));
  fs.writeFileSync(path.join(ROOT, "src/app/apple-icon.png"), await png(appleTree, 180, 180));
  console.log("OK: public/og.png + src/app/apple-icon.png");
})().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
