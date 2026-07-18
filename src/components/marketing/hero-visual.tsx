import { StarIcon, TrendingUpIcon } from "lucide-react";

/**
 * Ana sayfa kahraman görseli — ürünün kendisini satar: yükselen net grafiği,
 * KPI kutusu ve gerçek bir yorumdan mini kart. Statik SVG, sıfır JS.
 */

const POINTS = [74, 78.5, 77.25, 83.5, 87.25, 86, 92.25, 98.5];
const W = 440;
const H = 170;
const PAD = 14;

function toXy(value: number, index: number): [number, number] {
  const min = 68;
  const max = 104;
  const x = PAD + (index * (W - PAD * 2)) / (POINTS.length - 1);
  const y = H - PAD - ((value - min) / (max - min)) * (H - PAD * 2);
  return [x, y];
}

export function HeroVisual() {
  const coords = POINTS.map(toXy);
  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${PAD},${H - PAD} ${line} ${W - PAD},${H - PAD}`;
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* Ana kart: net grafiği */}
      <div className="relative z-10 flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-xl shadow-primary/10 ring-1 ring-foreground/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-muted-foreground">
              Toplam net — son 8 deneme
            </span>
            <span className="font-heading text-3xl font-bold tracking-tight tabular-nums">
              98,50
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success tabular-nums">
            <TrendingUpIcon className="size-3.5" />
            +24,5 net · 2 ay
          </span>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label="Sekiz denemede 74'ten 98,5'e yükselen net grafiği"
        >
          <defs>
            <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--primary)" stopOpacity="0.28" />
              <stop offset="1" stopColor="var(--primary)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((t) => (
            <line
              key={t}
              x1={PAD}
              x2={W - PAD}
              y1={PAD + t * (H - PAD * 2)}
              y2={PAD + t * (H - PAD * 2)}
              stroke="currentColor"
              className="text-foreground/8"
              strokeDasharray="3 5"
            />
          ))}
          <polygon points={area} fill="url(#hero-area)" />
          <polyline
            points={line}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {coords.slice(0, -1).map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3.5" fill="var(--primary)" />
          ))}
          {/* Son deneme — derecenin altını */}
          <circle cx={lastX} cy={lastY} r="6" fill="var(--gold)" />
          <circle cx={lastX} cy={lastY} r="10" fill="var(--gold)" opacity="0.25" />
        </svg>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>Mayıs</span>
          <span>Haziran</span>
          <span>Temmuz</span>
        </div>
      </div>

      {/* Yüzen mini yorum kartı */}
      <div className="absolute -top-6 -right-2 z-20 hidden w-52 rotate-2 flex-col gap-1.5 rounded-xl bg-card p-3.5 shadow-lg ring-1 ring-foreground/10 sm:flex lg:-right-6">
        <span className="flex items-center gap-0.5" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} className="size-3 fill-gold text-gold" />
          ))}
        </span>
        <p className="text-xs leading-snug text-pretty">
          “Matematiği sevdiren bir hoca.”
        </p>
        <span className="text-[11px] text-muted-foreground">Didem T. · LGS</span>
      </div>

      {/* Yüzen KPI kartı */}
      <div className="absolute -bottom-6 -left-2 z-20 hidden -rotate-2 flex-col gap-0.5 rounded-xl bg-card p-3.5 shadow-lg ring-1 ring-foreground/10 sm:flex lg:-left-6">
        <span className="text-[11px] font-medium text-muted-foreground">
          Bu hafta çözülen soru
        </span>
        <span className="font-heading text-xl font-bold tabular-nums">1.240</span>
        <span className="text-[11px] font-semibold text-success tabular-nums">
          +18% geçen haftaya göre
        </span>
      </div>

      {/* Arka ışıltılar */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-10 left-1/2 h-56 w-[26rem] max-w-full -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-6 bottom-0 size-36 rounded-full bg-gold/20 blur-2xl" />
      </div>
    </div>
  );
}
