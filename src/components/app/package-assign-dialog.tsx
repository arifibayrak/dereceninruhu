"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { assignPackage } from "@/actions/paketler";
import { callAction } from "@/lib/action-client";
import { trDayKey } from "@/lib/dates";
import { kurusToTryInput } from "@/lib/muhasebe";
import {
  PACKAGE_KIND_LABELS,
  RENEWAL_LABELS,
  type PackageKind,
  type Renewal,
} from "@/lib/ozel-ders";
import { useRefresh } from "@/lib/use-refresh";
import { assignPackageSchema } from "@/lib/validation-paket";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type FormInput = z.input<typeof assignPackageSchema>;
type FormOutput = z.output<typeof assignPackageSchema>;

/** Katalogdan seçilebilecek paket — form alanlarını ön-doldurur. */
export type CatalogPackage = {
  id: number;
  name: string;
  kind: PackageKind;
  priceKurus: number;
  lessonHours: number | null;
  renewal: Renewal;
};

export type AssignedPackage = {
  id: number;
  packageId: number | null;
  name: string;
  kind: PackageKind;
  priceKurus: number;
  lessonHoursGranted: number;
  renewal: Renewal;
  hoursPerPeriod: number;
  startsOn: Date | null;
  endsOn: Date | null;
  status: "aktif" | "bitti" | "iptal";
  note: string | null;
};

const KIND_ITEMS = (
  Object.entries(PACKAGE_KIND_LABELS) as [PackageKind, string][]
).map(([value, label]) => ({ value, label }));

const STATUS_ITEMS = [
  { value: "aktif", label: "Aktif" },
  { value: "bitti", label: "Bitti" },
  { value: "iptal", label: "İptal" },
];

const RENEWAL_ITEMS = (
  Object.entries(RENEWAL_LABELS) as [Renewal, string][]
).map(([value, label]) => ({ value, label }));

const CUSTOM = "ozel";

/**
 * Öğrenciye paket atama / atamayı düzenleme.
 *
 * Katalogdan seçmek yalnız ALANLARI DOLDURUR; kaydedilen değerler her zaman
 * formdakilerdir. Bilinçli: atama, fiyatın o günkü kopyasıdır — katalogdaki
 * fiyat sonradan değişince öğrencinin anlaşması ve faturaları kaymaz. Katalog
 * dışı özel anlaşmalar da aynı formdan girilir ("Özel anlaşma").
 */
export function PackageAssignDialog({
  enrollmentId,
  catalog,
  assigned,
}: {
  enrollmentId: number;
  catalog: CatalogPackage[];
  assigned?: AssignedPackage;
}) {
  const { refresh } = useRefresh();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(assignPackageSchema),
    defaultValues: {
      enrollmentPackageId: assigned?.id,
      enrollmentId,
      packageId: assigned?.packageId ?? undefined,
      name: assigned?.name ?? "",
      priceTl: assigned ? kurusToTryInput(assigned.priceKurus) : "",
      kind: assigned?.kind ?? "kocluk",
      lessonHours: assigned?.lessonHoursGranted ?? 0,
      renewal: assigned?.renewal ?? "yok",
      hoursPerPeriod: assigned?.hoursPerPeriod ?? 0,
      startsOn: assigned?.startsOn ? trDayKey(assigned.startsOn) : undefined,
      endsOn: assigned?.endsOn ? trDayKey(assigned.endsOn) : undefined,
      status: assigned?.status ?? "aktif",
      note: assigned?.note ?? "",
    },
  });
  const { errors } = form.formState;
  const kind = useWatch({ control: form.control, name: "kind" });
  const renewal = useWatch({ control: form.control, name: "renewal" });
  const renews = renewal !== "yok";

  const applyCatalog = (value: string) => {
    if (value === CUSTOM) {
      form.setValue("packageId", undefined);
      return;
    }
    const pkg = catalog.find((c) => String(c.id) === value);
    if (!pkg) return;
    form.setValue("packageId", pkg.id);
    form.setValue("name", pkg.name);
    form.setValue("priceTl", kurusToTryInput(pkg.priceKurus));
    form.setValue("kind", pkg.kind);
    form.setValue("renewal", pkg.renewal);
    // Katalogdaki saat, yenilenen pakette DÖNEM BAŞINA demektir.
    if (pkg.renewal === "yok") {
      form.setValue("lessonHours", pkg.lessonHours ?? 0);
      form.setValue("hoursPerPeriod", 0);
    } else {
      form.setValue("hoursPerPeriod", pkg.lessonHours ?? 0);
      form.setValue("lessonHours", 0);
    }
  };

  const onSubmit = async (values: FormOutput) => {
    setSubmitting(true);
    const res = await callAction(assignPackage, values);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(assigned ? "Paket güncellendi" : "Paket atandı");
    setOpen(false);
    refresh();
  };

  const catalogItems = [
    ...catalog.map((c) => ({ value: String(c.id), label: c.name })),
    { value: CUSTOM, label: "Özel anlaşma (katalog dışı)" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={assigned ? "ghost" : "default"} size={assigned ? "icon-sm" : "sm"} />
        }
      >
        {assigned ? (
          <PencilIcon />
        ) : (
          <>
            <PlusIcon data-icon="inline-start" />
            Paket ata
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {assigned ? "Paketi düzenle" : "Öğrenciye paket ata"}
          </DialogTitle>
          <DialogDescription>
            Fiyat ve ad, atama anında kopyalanır — katalog sonradan değişse bile
            bu kayıt aynı kalır.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {!assigned && catalog.length > 0 && (
              <Field>
                <FieldLabel htmlFor="paket-katalog">Katalogdan seç</FieldLabel>
                <Select
                  items={catalogItems}
                  onValueChange={(v) => applyCatalog(v as string)}
                >
                  <SelectTrigger id="paket-katalog" className="w-full">
                    <SelectValue placeholder="Paket seç…" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogItems.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Alanları doldurur; hepsini elle değiştirebilirsin.
                </FieldDescription>
              </Field>
            )}

            <Field data-invalid={errors.name ? true : undefined}>
              <FieldLabel htmlFor="paket-ad-atama">Paket adı *</FieldLabel>
              <Input
                id="paket-ad-atama"
                placeholder="Örn. Aylık Koçluk"
                aria-invalid={errors.name ? true : undefined}
                {...form.register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={errors.kind ? true : undefined}>
                <FieldLabel htmlFor="paket-tur-atama">Tür *</FieldLabel>
                <Controller
                  control={form.control}
                  name="kind"
                  render={({ field }) => (
                    <Select
                      items={KIND_ITEMS}
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                    >
                      <SelectTrigger id="paket-tur-atama" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KIND_ITEMS.map((k) => (
                          <SelectItem key={k.value} value={k.value}>
                            {k.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.kind]} />
              </Field>

              <Field data-invalid={errors.priceTl ? true : undefined}>
                <FieldLabel htmlFor="paket-fiyat-atama">Ücret (₺) *</FieldLabel>
                <Input
                  id="paket-fiyat-atama"
                  inputMode="decimal"
                  placeholder="Örn. 3.999"
                  aria-invalid={errors.priceTl ? true : undefined}
                  {...form.register("priceTl")}
                />
                <FieldError errors={[errors.priceTl]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="paket-yenileme">Ders hakkı</FieldLabel>
              <Controller
                control={form.control}
                name="renewal"
                render={({ field }) => (
                  <Select
                    items={RENEWAL_ITEMS}
                    value={field.value ?? "yok"}
                    onValueChange={(v) => field.onChange(v)}
                  >
                    <SelectTrigger id="paket-yenileme" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RENEWAL_ITEMS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldDescription>
                Yenilenen pakette hak her dönem kendiliğinden eklenir;
                kullanılmayan saat yanmaz, birikir.
              </FieldDescription>
            </Field>

            {renews ? (
              <Field data-invalid={errors.hoursPerPeriod ? true : undefined}>
                <FieldLabel htmlFor="paket-donem-saat">
                  {renewal === "haftalik" ? "Haftada" : "Ayda"} kaç saat *
                </FieldLabel>
                <Input
                  id="paket-donem-saat"
                  inputMode="numeric"
                  placeholder={renewal === "haftalik" ? "1" : "4"}
                  aria-invalid={errors.hoursPerPeriod ? true : undefined}
                  {...form.register("hoursPerPeriod")}
                />
                <FieldError errors={[errors.hoursPerPeriod]} />
                <FieldDescription>
                  Başlangıç tarihinden itibaren her{" "}
                  {renewal === "haftalik" ? "hafta" : "ay"} bu kadar saat
                  eklenir. Toplam hak bu yüzden elle güncellenmez.
                </FieldDescription>
              </Field>
            ) : (
              <Field data-invalid={errors.lessonHours ? true : undefined}>
                <FieldLabel htmlFor="paket-saat-atama">
                  Toplam ders saati
                </FieldLabel>
                <Input
                  id="paket-saat-atama"
                  inputMode="numeric"
                  placeholder="0"
                  aria-invalid={errors.lessonHours ? true : undefined}
                  {...form.register("lessonHours")}
                />
                <FieldError errors={[errors.lessonHours]} />
                <FieldDescription>
                  {kind === "ozel_ders"
                    ? "Bu paketle verilecek toplam ders saati."
                    : "Koçluk paketine ders dahilse saatini yaz; değilse 0 bırak."}
                </FieldDescription>
              </Field>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={errors.startsOn ? true : undefined}>
                <FieldLabel htmlFor="paket-baslangic">
                  Başlangıç {renews ? "*" : ""}
                </FieldLabel>
                <Input
                  id="paket-baslangic"
                  type="date"
                  aria-invalid={errors.startsOn ? true : undefined}
                  {...form.register("startsOn")}
                />
                <FieldError errors={[errors.startsOn]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="paket-bitis">Bitiş</FieldLabel>
                <Input
                  id="paket-bitis"
                  type="date"
                  {...form.register("endsOn")}
                />
              </Field>
            </div>

            {assigned && (
              <Field>
                <FieldLabel htmlFor="paket-durum">Durum</FieldLabel>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      items={STATUS_ITEMS}
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                    >
                      <SelectTrigger id="paket-durum" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_ITEMS.map((sItem) => (
                          <SelectItem key={sItem.value} value={sItem.value}>
                            {sItem.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldDescription>
                  Yalnız &quot;Aktif&quot; paketler kalan saat sayacına girer.
                </FieldDescription>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="paket-not">Not</FieldLabel>
              <Textarea
                id="paket-not"
                rows={2}
                placeholder="Anlaşmaya dair kısa not (öğrenci görmez)"
                {...form.register("note")}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
