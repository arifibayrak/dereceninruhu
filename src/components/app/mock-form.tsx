"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TargetIcon } from "lucide-react";
import { toast } from "sonner";

import { createMock } from "@/actions/tracking";
import { trDayKey } from "@/lib/dates";
import { formatNet } from "@/lib/format";
import {
  computeNet,
  rollUpChildren,
  type SubjectCounts,
  type SubjectNode,
} from "@/lib/net";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type MockSubject = {
  id: number;
  name: string;
  isScored: boolean;
  parentSubjectId: number | null;
  officialQuestionCount: number | null;
};

export type MockSection = {
  id: number;
  name: string;
  wrongPenaltyDivisor: number;
  subjects: MockSubject[];
};

type Counts = { d: string; y: string; b: string };

type Props = {
  enrollmentId: number;
  sections: MockSection[];
  /** Başarıda gidilecek yol (öğrenci akışı); yoksa yalnız refresh (koç). */
  redirectTo?: string;
  /** Koç diyaloğunda kapatma vb. için (istemci-istemci callback). */
  onSuccess?: () => void;
};

const SCOPES = [
  { value: "full", label: "Tam deneme" },
  { value: "branch", label: "Branş denemesi" },
] as const;

/** Deneme girişi — D/Y/B gir, net canlı hesaplanır (D − Y ÷ bölen). */
export function MockForm({ enrollmentId, sections, redirectTo, onSuccess }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [sectionId, setSectionId] = useState<number>(sections[0]?.id ?? 0);
  const [scope, setScope] = useState<"full" | "branch">("full");
  const [takenOn, setTakenOn] = useState(() => trDayKey(new Date()));
  const [publisher, setPublisher] = useState("");
  const [name, setName] = useState("");
  const [counts, setCounts] = useState<Record<number, Counts>>({});

  const section = sections.find((s) => s.id === sectionId) ?? sections[0];

  const setCount = (subjectId: number, key: keyof Counts, raw: string) => {
    const clean = raw.replace(/\D/g, "").slice(0, 3);
    setCounts((prev) => {
      const current = prev[subjectId] ?? { d: "", y: "", b: "" };
      return { ...prev, [subjectId]: { ...current, [key]: clean } };
    });
  };

  const numOf = (subjectId: number, key: keyof Counts) => {
    const n = parseInt(counts[subjectId]?.[key] ?? "", 10);
    return Number.isFinite(n) ? n : 0;
  };

  /** Alt dersler puanlanan ebeveyne toplanmış canlı netler. */
  const { rolledNets, totalNet, hasAny } = useMemo(() => {
    if (!section) return { rolledNets: new Map<number, number>(), totalNet: 0, hasAny: false };
    const map = new Map<number, SubjectCounts>();
    let any = false;
    for (const s of section.subjects) {
      const d = numOf(s.id, "d");
      const y = numOf(s.id, "y");
      const b = numOf(s.id, "b");
      if (d + y + b > 0) any = true;
      map.set(s.id, { correct: d, wrong: y, blank: b });
    }
    const tree: SubjectNode[] = section.subjects.map((s) => ({
      id: s.id,
      parentSubjectId: s.parentSubjectId,
      isScored: s.isScored,
    }));
    const rolled = rollUpChildren(map, tree);
    const nets = new Map<number, number>();
    let total = 0;
    for (const [id, c] of rolled) {
      const net = computeNet(c.correct, c.wrong, section.wrongPenaltyDivisor);
      nets.set(id, net);
      total += net;
    }
    return { rolledNets: nets, totalNet: Math.round(total * 100) / 100, hasAny: any };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts, section]);

  const submit = async () => {
    if (!section) return;
    if (!takenOn) {
      toast.error("Deneme tarihini seç.");
      return;
    }
    const results = section.subjects
      .filter((s) => numOf(s.id, "d") + numOf(s.id, "y") + numOf(s.id, "b") > 0)
      .map((s) => ({
        subjectId: s.id,
        correctCount: numOf(s.id, "d"),
        wrongCount: numOf(s.id, "y"),
        blankCount: numOf(s.id, "b"),
      }));
    if (results.length === 0) {
      toast.error("En az bir ders için doğru/yanlış gir.");
      return;
    }
    setSaving(true);
    const res = await createMock({
      enrollmentId,
      examSectionId: section.id,
      scope,
      publisher,
      name,
      takenOn,
      results,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Deneme kaydedildi", {
      description: `Toplam ${formatNet(totalNet)} net`,
    });
    setCounts({});
    setPublisher("");
    setName("");
    onSuccess?.();
    if (redirectTo) {
      router.push(redirectTo);
      router.refresh();
    } else {
      router.refresh();
    }
  };

  if (!section) {
    return (
      <p className="text-sm text-muted-foreground">
        Bu sınav için tanımlı bölüm bulunamadı.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="deneme-bolum">Bölüm</FieldLabel>
          <Select
            items={sections.map((s) => ({ value: s.id, label: s.name }))}
            value={section.id}
            onValueChange={(v) => {
              if (typeof v === "number") setSectionId(v);
            }}
          >
            <SelectTrigger id="deneme-bolum" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sections.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="deneme-kapsam">Kapsam</FieldLabel>
          <Select
            items={[...SCOPES]}
            value={scope}
            onValueChange={(v) => {
              if (v === "full" || v === "branch") setScope(v);
            }}
          >
            <SelectTrigger id="deneme-kapsam" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCOPES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="deneme-tarih">Tarih</FieldLabel>
          <Input
            id="deneme-tarih"
            type="date"
            value={takenOn}
            max={trDayKey(new Date())}
            onChange={(e) => setTakenOn(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="deneme-yayin">Yayınevi</FieldLabel>
          <Input
            id="deneme-yayin"
            placeholder="Örn. 3D, Limit, Bilgi Sarmal"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="deneme-ad">Deneme adı</FieldLabel>
          <Input
            id="deneme-ad"
            placeholder="Örn. 3D TYT Deneme 13"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
      </div>

      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">Ders</th>
              <th className="px-1 py-2 text-center font-medium">D</th>
              <th className="px-1 py-2 text-center font-medium">Y</th>
              <th className="px-1 py-2 text-center font-medium">B</th>
              <th className="px-3 py-2 text-right font-medium">Net</th>
            </tr>
          </thead>
          <tbody>
            {section.subjects.map((subject) => {
              const isChild = subject.parentSubjectId != null;
              const net = rolledNets.get(subject.id);
              return (
                <tr key={subject.id} className="border-b last:border-0">
                  <td
                    className={cn(
                      "px-3 py-1.5 font-medium whitespace-nowrap",
                      isChild && "pl-6 text-muted-foreground font-normal",
                    )}
                  >
                    {subject.name}
                    {subject.officialQuestionCount != null && (
                      <span className="ml-1.5 text-[10px] text-muted-foreground tabular-nums">
                        /{subject.officialQuestionCount}
                      </span>
                    )}
                  </td>
                  {(["d", "y", "b"] as const).map((key) => (
                    <td key={key} className="px-0.5 py-1 text-center">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        aria-label={`${subject.name} ${
                          key === "d" ? "doğru" : key === "y" ? "yanlış" : "boş"
                        }`}
                        value={counts[subject.id]?.[key] ?? ""}
                        placeholder="·"
                        onChange={(e) => setCount(subject.id, key, e.target.value)}
                        className="h-9 w-11 rounded-md border border-transparent bg-transparent text-center tabular-nums transition-colors outline-none placeholder:text-muted-foreground/40 hover:border-input focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                    {subject.isScored && net !== undefined
                      ? formatNet(net)
                      : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/40 font-medium">
              <td colSpan={4} className="px-3 py-2">
                Toplam net
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">
                {hasAny ? formatNet(totalNet) : "–"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <Button size="lg" onClick={submit} disabled={saving || !hasAny} className="self-end">
        <TargetIcon data-icon="inline-start" />
        {saving ? "Kaydediliyor…" : "Denemeyi kaydet"}
      </Button>
    </div>
  );
}
