import { CompassIcon } from "lucide-react";

/** Öğrenci alanı — aktif kayıt bulunamadığında gösterilen boş durum. */
export function NoEnrollmentCard({ isCoach }: { isCoach: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
      <span className="flex size-11 items-center justify-center rounded-full bg-primary/10">
        <CompassIcon className="size-5 text-primary" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-heading text-lg font-semibold">
          {isCoach ? "Koç önizlemesi" : "Aktif kaydın bulunamadı"}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {isCoach
            ? "Bu ekran öğrenci hesabıyla girildiğinde kişisel verilerle dolar. Bir öğrencinin görünümünü incelemek için koç panelindeki kokpiti kullan."
            : "Hesabın bir koçluk kaydına bağlı görünmüyor. Koçunla iletişime geç, birlikte çözelim."}
        </p>
      </div>
    </div>
  );
}
