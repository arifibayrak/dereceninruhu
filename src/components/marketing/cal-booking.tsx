import { CoachCalBooking } from "@/components/app/coach-cal-booking";

/**
 * Cal.com inline booking embed (Ahmet'in 30 dk ücretsiz ön görüşme takvimi).
 * Ortak `CoachCalBooking` bileşenini sabit pazarlama linkiyle sarar.
 */
const CAL_LINK = "ahmet-hakan-almak-cbyguf/30min";
const CAL_URL = `https://cal.com/${CAL_LINK}`;

export function CalBooking() {
  return <CoachCalBooking calLink={CAL_LINK} url={CAL_URL} />;
}
