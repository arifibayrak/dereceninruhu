import type { Metadata } from "next";
import { StudentChat } from "@/components/app/student-chat";

export const metadata: Metadata = { title: "Asistan" };

export default function OgrenciAsistanPage() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="font-heading text-lg font-semibold">Asistan</h1>
        <p className="text-sm text-muted-foreground">
          Gelişimin hakkında sor — cevaplar yalnız senin verine dayanır.
        </p>
      </div>
      <StudentChat />
    </div>
  );
}
