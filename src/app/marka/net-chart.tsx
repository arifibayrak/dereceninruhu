/**
 * "Net gelişimi" mini grafik — statik SVG yer tutucu (sunucu bileşeni).
 * Uygulamada bu grafik Recharts ile ve --chart-* tokenlarıyla çizilecek;
 * buradaki amaç paletin grafik dilini göstermek.
 */

const DATA = [
  { label: "D1", net: 31.5 },
  { label: "D2", net: 34.25 },
  { label: "D3", net: 33.0 },
  { label: "D4", net: 38.75 },
  { label: "D5", net: 41.5 },
  { label: "D6", net: 40.25 },
  { label: "D7", net: 45.0 },
  { label: "D8", net: 48.75 },
];

const W = 560;
const H = 210;
const PLOT = { left: 34, right: 546, top: 14, bottom: 170 };
const Y_MIN = 25;
const Y_MAX = 55;

const netFormat = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 });

function x(i: number) {
  return PLOT.left + 14 + (i * (PLOT.right - PLOT.left - 14)) / (DATA.length - 1);
}
function y(net: number) {
  return (
    PLOT.bottom -
    ((net - Y_MIN) / (Y_MAX - Y_MIN)) * (PLOT.bottom - PLOT.top)
  );
}

export function NetChart() {
  const points = DATA.map((d, i) => ({ ...d, x: x(i), y: y(d.net) }));
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${points[points.length - 1].x.toFixed(1)} ${PLOT.bottom} L${points[0].x.toFixed(1)} ${PLOT.bottom} Z`;
  const first = points[0];
  const last = points[points.length - 1];
  const gridNets = [30, 40, 50];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Toplam net gelişimi, son 8 deneme: ${netFormat.format(first.net)} netten ${netFormat.format(last.net)} nete`}
    >
      {/* Sessiz ızgara */}
      {gridNets.map((net) => (
        <g key={net}>
          <line
            x1={PLOT.left}
            x2={PLOT.right}
            y1={y(net)}
            y2={y(net)}
            stroke="var(--border)"
            strokeWidth="1"
          />
          <text
            x={PLOT.left - 6}
            y={y(net) + 3}
            textAnchor="end"
            fontSize="10"
            fill="var(--muted-foreground)"
          >
            {net}
          </text>
        </g>
      ))}
      {/* Alan + çizgi */}
      <path
        d={area}
        fill="color-mix(in oklab, var(--chart-1) 10%, transparent)"
      />
      <path
        d={line}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* İlk nokta + etiket */}
      <circle cx={first.x} cy={first.y} r="3.5" fill="var(--chart-1)" stroke="var(--card)" strokeWidth="2" />
      <text
        x={first.x}
        y={first.y - 10}
        textAnchor="start"
        fontSize="11"
        fill="var(--muted-foreground)"
      >
        {netFormat.format(first.net)}
      </text>
      {/* Son nokta — derecenin altını */}
      <circle cx={last.x} cy={last.y} r="5" fill="var(--gold)" stroke="var(--card)" strokeWidth="2" />
      <text
        x={last.x - 2}
        y={last.y - 12}
        textAnchor="end"
        fontSize="12"
        fontWeight="600"
        fill="var(--foreground)"
      >
        {netFormat.format(last.net)}
      </text>
      {/* X ekseni etiketleri */}
      {points.map((p) => (
        <text
          key={p.label}
          x={p.x}
          y={H - 18}
          textAnchor="middle"
          fontSize="10"
          fill="var(--muted-foreground)"
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}

/** Ders bazında net dağılımı — yatay çubuklar, ders paleti (chart-1..5). */
const SUBJECTS = [
  { name: "Matematik", net: 31.25, max: 40, token: "--chart-1" },
  { name: "Türkçe", net: 34.5, max: 40, token: "--chart-2" },
  { name: "Fen Bilimleri", net: 16.75, max: 20, token: "--chart-3" },
  { name: "Sosyal Bilgiler", net: 14.25, max: 20, token: "--chart-4" },
  { name: "Yabancı Dil", net: 61.5, max: 80, token: "--chart-5" },
];

export function SubjectBars() {
  return (
    <ul className="flex flex-col gap-3">
      {SUBJECTS.map((s) => (
        <li key={s.name} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="inline-flex items-center gap-2 font-medium">
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: `var(${s.token})` }}
              />
              {s.name}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {netFormat.format(s.net)}{" "}
              <span className="text-xs">/ {s.max}</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(s.net / s.max) * 100}%`,
                backgroundColor: `var(${s.token})`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
