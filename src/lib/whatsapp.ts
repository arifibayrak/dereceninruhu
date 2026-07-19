import { normalizePhone } from "@/lib/phone";

/**
 * WhatsApp deep-link helper. We never auto-send (no Business API) — the coach
 * fires these from their own WhatsApp with the message pre-filled. ₺0, human-in-loop.
 */

/** Build a wa.me link to a TR number with an optional pre-filled message. */
export function buildWaLink(phone: string, message?: string): string {
  const local = normalizePhone(phone); // 10 digits, e.g. 5384360511
  const intl = local.length === 10 ? `90${local}` : local;
  const base = `https://wa.me/${intl}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

type ReminderCtx = {
  studentName: string;
  coachName?: string;
  /** Days since last activity, for the staleness nudge. */
  days?: number;
  amountTry?: string; // pre-formatted, e.g. "2.500 ₺"
  when?: string; // e.g. "yarın 19:00"
  pin?: string; // yeni PIN — pinSifirla için
};

/** Turkish reminder message templates (warm, first-person from the coach). */
export const waTemplates = {
  soruGiris: ({ studentName, days }: ReminderCtx) =>
    `Merhaba ${studentName} 👋 ${
      days ? `${days} gündür soru girişi göremedim. ` : ""
    }Bugünkü çözdüğün soruları uygulamaya işlemeyi unutma, birlikte takip edelim 💪`,

  denemeAnaliz: ({ studentName }: ReminderCtx) =>
    `${studentName}, son denemenin analizini birlikte çıkaralım — netlerini ve eksik konularını uygulamaya girer misin? 📊`,

  gorusme: ({ studentName, when }: ReminderCtx) =>
    `${studentName}, ${
      when ?? "yaklaşan"
    } koçluk görüşmemiz var. Öncesinde bu haftanın programını ve soru takibini doldurmayı unutma 🙌`,

  odemeGecikti: ({ studentName, amountTry }: ReminderCtx) =>
    `Merhaba ${studentName}, ${
      amountTry ? `${amountTry} tutarındaki ` : ""
    }ödemenin vadesi geçmiş görünüyor. Uygun olduğunda halledebilir miyiz? Teşekkürler 🙏`,

  davet: ({ studentName }: ReminderCtx) =>
    `Merhaba ${studentName}! Derecenin Ruhu takip sistemine davetlisin. Aşağıdaki bağlantıdan PIN'ini belirleyip başlayabilirsin 👇`,

  /** Koç öğrencinin PIN'ini sıfırladı — yeni PIN + giriş bağlantısı. */
  pinSifirla: ({ studentName, pin }: ReminderCtx) =>
    `Merhaba ${studentName} 👋 Giriş PIN'ini yeniledim: ${
      pin ?? "••••"
    }. dereceninruhu.com/katil adresinden telefonun ve bu PIN ile girebilirsin. İstersen sonra kendine göre değiştirebilirsin 🙌`,

  /** Site formundan gelen lead'e ilk temas (ücretsiz ön görüşme planlama). */
  leadIlkTemas: ({ studentName }: ReminderCtx) =>
    `Merhaba ${studentName} 👋 Derecenin Ruhu'na bıraktığın ön görüşme talebin için teşekkürler! Ücretsiz ön görüşmemizi planlamak için yazıyorum — bugün ya da yarın hangi saatler uygun olur? 😊`,

  /** Bekleme listesindeki kişiye kontenjan açıldı daveti. */
  beklemeDavet: ({ studentName }: ReminderCtx) =>
    `Merhaba ${studentName} 👋 Derecenin Ruhu bekleme listesindeydin — bu dönem için sana bir kontenjan açıldı! 🎯 Kaydını tamamlamak ve ücretsiz ön görüşmeni planlamak için uygun olduğun saatleri yazar mısın?`,

  /** Bekleme listesini sıcak tutma — henüz sıra gelmedi. */
  beklemeNurture: ({ studentName }: ReminderCtx) =>
    `Merhaba ${studentName} 🙌 Bekleme listemizde öncelikli bir yerdesin. Kontenjan açılır açılmaz ilk sana haber vereceğiz. Bu arada aklına takılan her şeyi buradan sorabilirsin 💬`,

  /** Koç başvurusuna tanışma görüşmesi daveti. */
  basvuruGorusme: ({ studentName }: ReminderCtx) =>
    `Merhaba ${studentName} 👋 Derecenin Ruhu koç başvurun için teşekkürler! Başvurunu değerlendirdik ve seninle bir tanışma görüşmesi yapmak isteriz. Bu hafta hangi gün/saat uygun olur? 😊`,
} satisfies Record<string, (ctx: ReminderCtx) => string>;
