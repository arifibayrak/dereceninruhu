import { redirect } from "next/navigation";

/** Pazarlama sitesi sonraki fazda; şimdilik uygulama girişine yönlendir. */
export default function Home() {
  redirect("/giris");
}
