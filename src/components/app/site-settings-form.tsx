"use client";

import { useState } from "react";
import { EyeIcon, ExternalLinkIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { useRefresh } from "@/lib/use-refresh";
import { callAction } from "@/lib/action-client";
import { updateSiteSettings } from "@/actions/site-settings";
import { buildWaLink, DEFAULT_WA_PHONE } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type SiteSettingsValues = {
  whatsappPhone: string | null;
  whatsappMessage: string;
  whatsappVisible: boolean;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  publicStatsVisible: boolean;
};

/**
 * Site iletişim/sosyal ayarları — yüzen WhatsApp butonunu ve header/footer
 * sosyal ikonlarını besler. Boş bırakılan alanlar koddaki sabitlere düşer:
 * sosyal için SOCIAL_LINKS, telefon için DEFAULT_WA_PHONE (yer tutucular
 * gerçek adresleri gösterir). Butonu gizleyen tek anahtar `whatsappVisible`.
 */
export function SiteSettingsForm({ initial }: { initial: SiteSettingsValues }) {
  const { refresh } = useRefresh();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({
    whatsappPhone: initial.whatsappPhone ?? "",
    whatsappMessage: initial.whatsappMessage,
    whatsappVisible: initial.whatsappVisible,
    instagramUrl: initial.instagramUrl ?? "",
    tiktokUrl: initial.tiktokUrl ?? "",
    youtubeUrl: initial.youtubeUrl ?? "",
    publicStatsVisible: initial.publicStatsVisible,
  });

  // Alan boşken canlıda DEFAULT_WA_PHONE kullanılıyor → önizleme de onu göstersin.
  // Yarım girilmiş numarada (1-9 hane) önizleme yok: yanlış linki test ettirmeyelim.
  const digits = values.whatsappPhone.replace(/\D/g, "");
  const previewPhone =
    digits.length >= 10
      ? values.whatsappPhone
      : digits.length === 0
        ? DEFAULT_WA_PHONE
        : null;
  const previewHref = previewPhone
    ? buildWaLink(previewPhone, values.whatsappMessage)
    : null;

  const save = async () => {
    setSaving(true);
    const res = await callAction(updateSiteSettings, {
      whatsappPhone: values.whatsappPhone,
      whatsappMessage: values.whatsappMessage,
      whatsappVisible: values.whatsappVisible,
      instagramUrl: values.instagramUrl,
      tiktokUrl: values.tiktokUrl,
      youtubeUrl: values.youtubeUrl,
      publicStatsVisible: values.publicStatsVisible,
    });
    setSaving(false);
    if (!res.ok) {
      const first = res.fieldErrors
        ? Object.values(res.fieldErrors)[0]
        : undefined;
      toast.error(first ?? res.error);
      return;
    }
    toast.success("İletişim ayarı kaydedildi");
    refresh();
  };

  return (
    <FieldGroup className="max-w-2xl">
      <Field>
        <FieldLabel htmlFor="site-wa-tel">WhatsApp İşletme numarası</FieldLabel>
        <Input
          id="site-wa-tel"
          inputMode="tel"
          placeholder="0538 436 05 11"
          value={values.whatsappPhone}
          onChange={(e) =>
            setValues({ ...values, whatsappPhone: e.target.value })
          }
        />
        <FieldDescription>
          Boş bırakılırsa koddaki varsayılan işletme numarası kullanılır; buton
          yine görünür. Tamamen kapatmak için aşağıdaki kutunun işaretini
          kaldır. +90 / 0 / boşluk serbest — kaydederken otomatik düzeltilir.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="site-wa-mesaj">Hazır mesaj *</FieldLabel>
        <Textarea
          id="site-wa-mesaj"
          rows={2}
          maxLength={300}
          value={values.whatsappMessage}
          onChange={(e) =>
            setValues({ ...values, whatsappMessage: e.target.value })
          }
        />
        <FieldDescription>
          Öğrenci butona bastığında WhatsApp&apos;ta yazılı gelir; göndermeye
          kendisi karar verir.
        </FieldDescription>
      </Field>

      {previewHref && (
        <a
          href={previewHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Bağlantıyı test et
          <ExternalLinkIcon className="size-3.5" />
        </a>
      )}

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium select-none">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={values.whatsappVisible}
          onChange={(e) =>
            setValues({ ...values, whatsappVisible: e.target.checked })
          }
        />
        <EyeIcon className="size-4" />
        Yüzen WhatsApp butonu sitede görünsün
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="site-ig">Instagram</FieldLabel>
          <Input
            id="site-ig"
            placeholder="https://www.instagram.com/derecenin_ruhu/"
            value={values.instagramUrl}
            onChange={(e) =>
              setValues({ ...values, instagramUrl: e.target.value })
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="site-tt">TikTok</FieldLabel>
          <Input
            id="site-tt"
            placeholder="https://www.tiktok.com/@dereceninruhu"
            value={values.tiktokUrl}
            onChange={(e) =>
              setValues({ ...values, tiktokUrl: e.target.value })
            }
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="site-yt">YouTube</FieldLabel>
        <Input
          id="site-yt"
          placeholder="https://www.youtube.com/@Dereceninruhu"
          value={values.youtubeUrl}
          onChange={(e) =>
            setValues({ ...values, youtubeUrl: e.target.value })
          }
        />
        <FieldDescription>
          Üçü de boş bırakılabilir — o zaman koddaki varsayılan adresler
          kullanılır (yukarıdaki yer tutucular).
        </FieldDescription>
      </Field>

      <label className="flex w-fit cursor-pointer items-start gap-2 border-t pt-4 text-sm select-none">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-primary"
          checked={values.publicStatsVisible}
          onChange={(e) =>
            setValues({ ...values, publicStatsVisible: e.target.checked })
          }
        />
        <span>
          <span className="font-medium">
            Başarılar sayfasında şeffaflık sayaçları görünsün
          </span>
          <span className="block text-xs text-muted-foreground">
            Toplam çözülen soru, girilen deneme ve net artışının medyanı
            yayınlanır. Öğrenci sayısı ve kontenjan asla gösterilmez.
          </span>
        </span>
      </label>

      <Button size="lg" className="self-start" onClick={save} disabled={saving}>
        <SaveIcon data-icon="inline-start" />
        {saving ? "Kaydediliyor…" : "İletişim ayarını kaydet"}
      </Button>
    </FieldGroup>
  );
}
