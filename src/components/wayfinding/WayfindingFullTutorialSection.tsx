"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, MousePointer2, Navigation, Search, View } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import styles from "./WayfindingFullTutorialSection.module.css";

export function WayfindingFullTutorialSection() {
  const router = useRouter();
  const store = useMapStore();
  const lang = store.lang;

  const steps = [
    {
      num: "01",
      tag: lang === "ID" ? "Pencarian Seketika" : "Instant Search",
      title: lang === "ID" ? "Temukan Gate, Maskapai & Fasilitas" : "Find Gates, Airlines & Facilities",
      icon: Search,
      desc: lang === "ID"
        ? "Ketik langsung nama tujuan Anda: Boarding Gate 1–12, konter maskapai, toilet, musholla, hingga restoran favorit."
        : "Type your destination directly: Gates 1–12, check-in desks, prayer rooms, restrooms, or cafes.",
      cta: lang === "ID" ? "Buka peta" : "Open map",
      onCta: () => router.push("/map"),
    },
    {
      num: "02",
      tag: lang === "ID" ? "Navigasi Multi-Lantai" : "Multi-Floor Routes",
      title: lang === "ID" ? "Panduan Terhubung Lantai 1 & 2" : "Seamless Levels 1 & 2 Guidance",
      icon: MousePointer2,
      desc: lang === "ID"
        ? "Peta cerdas menghubungkan lantai dasar (Check-in/Kedatangan) dan lantai 2 (Ruang Boarding) via eskalator dan tangga."
        : "Intelligent routing connects the ground floor (Check-in/Arrivals) and level 2 (Boarding Lounge) via escalators.",
      cta: lang === "ID" ? "Pilih di peta" : "Choose on map",
      onCta: () => router.push("/map"),
    },
    {
      num: "03",
      tag: lang === "ID" ? "Estimasi Waktu Riil" : "Real Walking Time",
      title: lang === "ID" ? "Jarak & Waktu Tempuh Akurat" : "Accurate Distance & Walking ETA",
      icon: Navigation,
      desc: lang === "ID"
        ? "Ketahui jarak meter riil dan perkiraan menit berjalan santai ke boarding gate agar Anda tidak ketinggalan pesawat."
        : "Get exact walking meters and minutes to your boarding gate so you board your flight comfortably on time.",
      cta: lang === "ID" ? "Lihat panduan rute" : "View route guide",
      onCta: () => router.push("/help"),
    },
    {
      num: "04",
      tag: lang === "ID" ? "100% Akses Web" : "100% Web Based",
      title: lang === "ID" ? "Langsung Diakses Tanpa Aplikasi" : "Instant Access, No App Needed",
      icon: View,
      desc: lang === "ID"
        ? "Buka langsung lewat browser smartphone atau tablet. Ringan, cepat, dan responsif dengan mode peta 3D interaktif."
        : "Open directly in your mobile browser. Fast, lightweight, and responsive with interactive 3D navigation.",
      cta: lang === "ID" ? "Buka peta 3D" : "Open 3D map",
      onCta: () => router.push("/map"),
    },
  ];

  return (
    <section
      className={styles.section}
      id="panduan-lengkap"
      aria-labelledby="guide-title"
      data-scroll-reveal
    >
      <div className={styles.inner}>
        <header className={styles.header} data-reveal-child>
          <div className={styles.headerGrid}>
            <h2 id="guide-title">
              {lang === "ID" ? (
                <>Navigasi bandara yang <span>mudah, cepat, dan presisi.</span></>
              ) : (
                <>Airport navigation made <span>simple, fast, and precise.</span></>
              )}
            </h2>
            <p>
              {lang === "ID"
                ? "Dirancang khusus untuk memandu penumpang Terminal 1 Bandara Internasional Juanda melangkah tenang dari drop zone hingga boarding pesawat."
                : "Engineered specifically to guide Juanda Airport Terminal 1 passengers seamlessly from drop zone to departure gate."}
            </p>
          </div>
        </header>

        <ol className={styles.stepList}>
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.num} className={styles.step} data-reveal-child>
                <div className={styles.index} aria-hidden="true">
                  <span className={styles.stepLabel}>{lang === "ID" ? "Langkah" : "Step"}</span>
                  <strong>{step.num}</strong>
                </div>

                <div className={styles.copy}>
                  <div className={styles.tag}>
                    <span className={styles.tagDot} />
                    <span>{step.tag}</span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                  <button type="button" onClick={step.onCta} className={styles.ctaBtn}>
                    <span>{step.cta}</span>
                    <span className={styles.ctaIcon}>
                      <ArrowRight size={15} />
                    </span>
                  </button>
                </div>

                <div className={styles.glyph} aria-hidden="true">
                  <div className={styles.glyphContainer}>
                    <Icon size={32} strokeWidth={1.8} />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
