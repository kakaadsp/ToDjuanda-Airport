"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  CornerUpRight,
  Eye,
  Flag,
  Layers,
  MapPin,
  Navigation,
  Navigation2,
  QrCode,
  Search,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useMapStore } from "@/store/mapStore";
import styles from "./HelpPage.module.css";

const guides = {
  ID: {
    title: "Dari bingung mencari arah, jadi tahu langkah berikutnya.",
    intro: "Ikuti empat langkah singkat untuk mencari tempat, menentukan posisi, dan membaca petunjuk rute di terminal.",
    start: "Mulai panduan",
    map: "Buka peta",
    sectionEyebrow: "CARA MENGGUNAKAN",
    sectionTitle: "Satu langkah pada satu waktu.",
    sectionIntro: "Pilih langkah yang ingin dipelajari. Contoh tampilan akan berganti agar kamu tahu apa yang perlu dilakukan di peta.",
    step: "LANGKAH",
    next: "Langkah berikutnya",
    previous: "Sebelumnya",
    tryIt: "Coba di peta",
    preview: "CONTOH TAMPILAN",
    previewNote: "Ilustrasi antarmuka, bukan posisi terminal secara langsung.",
    reminder: "Perlu diketahui",
    reminderText: "Peta 3D saat ini hanya mencakup Terminal 1 lantai dasar. Data dan rute perlu diverifikasi di lapangan; ikuti petunjuk resmi bandara untuk perjalanan sebenarnya.",
    passengerTitle: "Dari tiba di bandara sampai naik pesawat.",
    passengerIntro: "Ikuti urutan keberangkatan ini setelah mengetahui maskapai dan nomor penerbanganmu.",
    passengerNote: "Denah lantai 2 sudah tersedia, tetapi rute otomatis dari lantai dasar ke gate belum aktif di Maps. Cocokkan selalu nomor gate dan waktu boarding dengan layar informasi serta arahan petugas.",
    passengerSteps: [
      { floor: "Lantai dasar", title: "Cari area Departure maskapaimu", description: "Cek papan informasi keberangkatan atau tanyakan kepada maskapai, lalu menuju Departure 1, 2, 3, atau 4 yang ditentukan. Departure adalah area check-in, bukan nomor loket." },
      { floor: "Lantai dasar", title: "Check-in dan ambil boarding pass", description: "Datangi konter maskapai di area Departure yang sesuai atau gunakan kios jika tersedia. Simpan boarding pass/tiket untuk melihat informasi penerbanganmu." },
      { floor: "Sebelum menuju gate", title: "Pastikan nomor gate", description: "Lihat nomor gate di boarding pass atau layar informasi bandara. Jika belum tercantum, pantau layar informasi karena gate dapat diumumkan atau berubah." },
      { floor: "Lantai 2", title: "Naik ke lantai 2 dan temukan gate", description: "Ikuti papan petunjuk Keberangkatan ke lantai 2, lalui pemeriksaan sesuai arahan terminal, kemudian ikuti papan nomor gate sampai ruang tunggu. Minta bantuan petugas jika petunjuknya tidak jelas." },
      { floor: "Di gate", title: "Boarding dan masuk pesawat", description: "Saat boarding dibuka, cocokkan nomor penerbangan dan gate sekali lagi. Siapkan boarding pass dan ikuti arahan petugas hingga masuk ke pesawat." },
    ],
    faqEyebrow: "PERTANYAAN UMUM",
    faqTitle: "Kalau masih ragu, mulai dari sini.",
    closingTitle: "Siap mencoba sendiri?",
    closingEyebrow: "SIAP MENJELAJAH",
    closingText: "Buka peta, pilih titik awal dan tujuan, lalu lihat bagaimana rute ditampilkan.",
    steps: [
      {
        short: "Cari lokasi",
        title: "Cari gate, tenant, atau fasilitas terminal.",
        desc: "Gunakan kolom pencarian di halaman Maps untuk menemukan boarding gate, konter check-in maskapai, musala, toilet, ATM, maupun resto di Terminal 1 Juanda. Anda juga dapat langsung mengeklik area atau gedung pada peta 3D.",
        tips: [
          "Ketik nama spesifik seperti Gate 1, Batik Air, atau Kedai Roti O.",
          "Gunakan filter kategori cepat untuk menemukan fasilitas umum terdekat.",
        ],
        action: "Buka pencarian peta",
        href: "/map",
      },
      {
        short: "Tentukan posisi",
        title: "Tetapkan titik awal keberangkatan Anda.",
        desc: "Tentukan posisi awal tempat Anda berdiri saat ini. Anda dapat memindai QR code pada standee fisik bandara terdekat untuk posisi instan 0 detik, atau memilih 'Start Here' pada pintu masuk dan gedung di denah terminal.",
        tips: [
          "Pindai QR standee di lapangan untuk akurasi posisi instan tanpa GPS indoor.",
          "Atau klik tombol 'Set Start' lalu pilih lokasi awal Anda pada denah terminal.",
        ],
        action: "Tetapkan posisi di peta",
        href: "/map",
      },
      {
        short: "Ikuti rute",
        title: "Panduan rute cerdas belokan demi belokan.",
        desc: "Peta menghitung jalur pejalan kaki terpendek dan teraman. Garis rute 3D berpendar akan menuntun langkah Anda dari konter check-in langsung ke boarding gate lengkap dengan jarak meter riil dan estimasi menit jalan santai.",
        tips: [
          "Pantau estimasi waktu jalan kaki (ETA) agar tidak terburu-buru menuju gate.",
          "Jalur rute terverifikasi resmi hanya melalui koridor pejalan kaki, tangga, dan eskalator.",
        ],
        action: "Rencanakan rute di peta",
        href: "/map",
      },
      {
        short: "Kontrol peta",
        title: "Sudut pandang pengunjung & multi-lantai.",
        desc: "Gunakan mode 'Visitor POV' untuk melihat terminal dari sudut pandang nyata mata pejalan kaki, atau 'Map View' untuk tampak atas. Anda juga dapat berganti secara leluasa antara Lantai 1 (GF) dan Lantai 2 (Gate).",
        tips: [
          "Mode 'Visitor POV' memudahkan orientasi spasial bentuk gedung dan arah belokan.",
          "Gunakan switcher lantai untuk mengecek fasilitas di Lantai 1 (GF) dan Lantai 2 (L2).",
        ],
        action: "Jelajahi peta 3D",
        href: "/map",
      },
    ],
    faq: [
      { q: "Bagaimana kalau saya tidak tahu posisi awal?", a: "Pilih building atau node terdekat secara manual melalui Set Start. Peta ini belum mendeteksi posisi secara otomatis." },
      { q: "Mengapa rute tidak muncul?", a: "Pastikan titik awal sudah ditetapkan dan building tujuan terhubung pada jaringan navigasi. Coba tujuan lain bila jalur tidak ditemukan." },
      { q: "Apakah peta ini sudah bisa dipakai sebagai panduan bandara nyata?", a: "Belum sebagai satu-satunya panduan. Cakupannya baru Terminal 1 lantai dasar dan data harus diverifikasi di lokasi. Ikuti petunjuk resmi terminal." },
    ],
  },
  EN: {
    title: "From finding your bearings to knowing your next step.",
    intro: "Follow four short steps to find a place, set your position, and read a route through the terminal.",
    start: "Start the guide",
    map: "Open map",
    sectionEyebrow: "HOW IT WORKS",
    sectionTitle: "One step at a time.",
    sectionIntro: "Choose a step to explore. The screen example changes with it, so you can see what to do on the map.",
    step: "STEP",
    next: "Next step",
    previous: "Previous",
    tryIt: "Try on map",
    preview: "SCREEN PREVIEW",
    previewNote: "Interface illustration, not a live terminal position.",
    reminder: "Good to know",
    reminderText: "The current 3D map covers Terminal 1 ground floor only. Location data and routes need on-site verification; follow official airport signs for real journeys.",
    passengerTitle: "From arriving at the airport to boarding your flight.",
    passengerIntro: "Follow these departure steps once you know your airline and flight number.",
    passengerNote: "A second-floor plan is available, but automated routes from the ground floor to gates are not active in Maps yet. Always confirm your gate and boarding time on airport displays and with staff.",
    passengerSteps: [
      { floor: "Ground floor", title: "Find your airline's Departure area", description: "Check the departure display or ask your airline, then head to the assigned Departure 1, 2, 3, or 4. Departure identifies a check-in area, not a specific counter." },
      { floor: "Ground floor", title: "Check in and get your boarding pass", description: "Go to your airline's counter in the correct Departure area, or use a kiosk if available. Keep your boarding pass for your flight details." },
      { floor: "Before heading to the gate", title: "Confirm your gate number", description: "Find the gate on your boarding pass or an airport information display. If it has not been announced, keep checking the displays because gates may change." },
      { floor: "Second floor", title: "Go upstairs and find your gate", description: "Follow Departure signs to the second floor, complete screening as directed in the terminal, then follow your gate number to the waiting area. Ask airport staff if the signs are unclear." },
      { floor: "At the gate", title: "Board your flight", description: "When boarding begins, check the flight number and gate once more. Have your boarding pass ready and follow staff directions onto the aircraft." },
    ],
    faqEyebrow: "COMMON QUESTIONS",
    faqTitle: "Still unsure? Start here.",
    closingTitle: "Ready to try it?",
    closingEyebrow: "READY TO GO",
    closingText: "Open the map, choose a starting point and destination, then see how a route appears.",
    steps: [
      {
        short: "Find a place",
        title: "Search for gates, check-in, or amenities.",
        desc: "Use the search bar on the Maps page to locate boarding gates, airline counters, prayer rooms, restrooms, ATMs, and dining options across Terminal 1. You can also click any space directly on the 3D map.",
        tips: [
          "Type specific terms such as Gate 1, Batik Air, or Roti O.",
          "Use quick category chips to find nearby public amenities right away.",
        ],
        action: "Open map search",
        href: "/map",
      },
      {
        short: "Set position",
        title: "Set your departure starting point.",
        desc: "Choose where you are currently standing. You can scan the QR code on the nearest physical terminal standee for instant positioning, or select 'Start Here' on any entrance or building on the map.",
        tips: [
          "Scan airport QR standees for immediate corridor accuracy without indoor GPS drift.",
          "Or click 'Set Start' and select your departure point directly on the layout.",
        ],
        action: "Set position on map",
        href: "/map",
      },
      {
        short: "Follow route",
        title: "Turn-by-turn intelligent indoor wayfinding.",
        desc: "The map calculates the shortest and safest pedestrian route. An illuminated 3D path guides you from check-in counters directly to your boarding gate with real meter distances and walking time ETA.",
        tips: [
          "Keep an eye on the estimated walking time (ETA) to board comfortably.",
          "Routes strictly follow official walkways, escalators, and airport corridors.",
        ],
        action: "Plan route on map",
        href: "/map",
      },
      {
        short: "Map controls",
        title: "Visitor POV & multi-floor navigation.",
        desc: "Switch to 'Visitor POV' to experience the terminal at eye-level walking perspective, or use 'Map View' for an overhead overview. Easily toggle between Floor 1 (GF) and Floor 2 (Gates).",
        tips: [
          "Use 'Visitor POV' for real-world spatial orientation of corridors and turns.",
          "Use the floor switcher to view Floor 1 (Check-in) and Floor 2 (Gates).",
        ],
        action: "Explore 3D map",
        href: "/map",
      },
    ],
    faq: [
      { q: "What if I don't know my starting point?", a: "Choose the nearest building or node manually with Set Start. Automatic positioning is not available yet." },
      { q: "Why can't I see a route?", a: "Make sure a start is set and the destination building is connected to the navigation graph. Try another destination if no path is found." },
      { q: "Can I rely on this for a real airport journey?", a: "Not as the only guide. Coverage is limited to Terminal 1 ground floor and the data needs on-site verification. Follow official terminal signs." },
    ],
  },
} as const;

const icons = [Search, QrCode, Navigation, Layers] as const;

function StepPreview({ active, lang }: { active: number; lang: "ID" | "EN" }) {
  const id = lang === "ID";
  return (
    <div className={styles.previewScene} key={active} aria-hidden="true">
      <div className={styles.previewTop}>
        <span className={styles.previewBrand}>
          JUANDA SUB T1 · <b>DIGITAL TWIN HUD</b>
        </span>
        <div className={styles.previewDots}>
          <i />
          <i />
          <i />
        </div>
      </div>

      {/* STEP 1: PENCARIAN DIREKTORI LOKASI */}
      {active === 0 && (
        <div className={styles.searchScene}>
          <div className={styles.mockSearch}>
            <Search size={18} className={styles.mockSearchIcon} />
            <span className={styles.mockSearchQuery}>Gate 1</span>
            <span className={styles.mockSearchBadge}>ESC</span>
          </div>
          <div className={styles.mockCategory}>
            <span>{id ? "Semua" : "All"}</span>
            <span className={styles.categoryActive}>{id ? "Gate 1–12" : "Gates 1–12"}</span>
            <span>Check-in</span>
            <span>Tenant F&B</span>
            <span>Musala</span>
          </div>
          <div className={styles.mockResultsList}>
            <div className={`${styles.mockResult} ${styles.resultHighlight}`}>
              <span className={styles.resultIcon}>
                <MapPin size={17} />
              </span>
              <div className={styles.resultInfo}>
                <strong>Gate 1 - Keberangkatan Domestik</strong>
                <small>{id ? "Terminal 1 · Lantai 2 (L2) · Sayap Timur" : "Terminal 1 · Floor 2 (L2) · East Concourse"}</small>
              </div>
              <span className={styles.resultTag}>BOARDING GATE</span>
              <ChevronRight size={16} className={styles.resultArrow} />
            </div>
            <div className={styles.mockResult}>
              <span className={styles.resultIconMuted}>
                <Navigation2 size={16} />
              </span>
              <div className={styles.resultInfo}>
                <strong>Check-in Batik Air & Super Air Jet</strong>
                <small>{id ? "Terminal 1 · Lantai Dasar (GF) · Baris A" : "Terminal 1 · Ground Floor (GF) · Row A"}</small>
              </div>
              <span className={styles.resultTagMuted}>CHECK-IN</span>
              <ChevronRight size={16} className={styles.resultArrow} />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: TENTUKAN POSISI AWAL / QR STANDEE */}
      {active === 1 && (
        <div className={styles.qrScene}>
          <div className={styles.hudBadgeBox}>
            <div className={styles.hudBadgeLeft}>
              <span className={styles.hudEyebrow}>
                {id ? "TITIK AWAL (START HERE) · TERVERIFIKASI" : "CURRENT START POSITION · VERIFIED"}
              </span>
              <strong>Standee QR Check-in Area 1A</strong>
              <small>{id ? "Terminal 1 Juanda · Lantai Dasar (GF) · Pintu 1A" : "Terminal 1 Juanda · Ground Floor (GF) · Gate 1A"}</small>
            </div>
            <span className={styles.hudStatusPill}>
              <Check size={14} /> {id ? "Posisi Siap" : "Ready"}
            </span>
          </div>
          <div className={styles.qrCardSimulation}>
            <div className={styles.qrGlyphBox}>
              <QrCode size={36} strokeWidth={1.75} />
              <div className={styles.scanLaser} />
            </div>
            <div className={styles.qrCopyText}>
              <strong>{id ? "Pindai QR Standee Terdekat" : "Scan Nearest Airport Standee"}</strong>
              <p>
                {id
                  ? "Akurasi koridor 100% tanpa GPS indoor. Posisi Anda otomatis tersinkronisasi langsung dengan model 3D."
                  : "100% corridor precision without indoor GPS drift. Your position syncs automatically to the 3D model."}
              </p>
              <div className={styles.qrMetaTags}>
                <span>{id ? "0 Detik Akses" : "Zero-install"}</span>
                <span>{id ? "Multi-Lantai L1 & L2" : "Multi-floor L1 & L2"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: NAVIGASI BELOKAN DEMI BELOKAN (RUTE AKTIF) */}
      {active === 2 && (
        <div className={styles.routeScene}>
          <div className={styles.routeHeaderHud}>
            <div className={styles.routeEndpoints}>
              <span className={styles.endpointStart}>Check-in 1A</span>
              <ArrowRight size={14} className={styles.endpointArrow} />
              <span className={styles.endpointFinish}>Gate 1</span>
            </div>
            <div className={styles.routeEtaPill}>
              <strong>185 m</strong>
              <span>•</span>
              <strong>{id ? "±3 Menit Jalan" : "±3 Min Walk"}</strong>
            </div>
          </div>
          <div className={styles.turnGuidanceBanner}>
            <span className={styles.turnIconCircle}>
              <CornerUpRight size={17} />
            </span>
            <span>
              {id
                ? "Lurus 50m melewati koridor utama, lalu belok kanan menuju Gate 1"
                : "Walk straight 50m along main corridor, then turn right toward Gate 1"}
            </span>
          </div>
          <div className={styles.radarCanvasWrap}>
            <svg className={styles.routeMap} viewBox="0 0 520 170" fill="none" role="presentation">
              <path className={styles.mapCorridor} d="M30 40H170V88H280V40H490M50 135H170V88H390V135H490M90 18V155M430 18V155" />
              <path className={styles.routeLine} d="M75 135H170V88H280V45H430V30" />
              <circle cx="75" cy="135" r="9" fill="#10B981" stroke="#FFFFFF" strokeWidth="3.5" />
              <circle cx="430" cy="30" r="9" fill="#00C6F4" stroke="#FFFFFF" strokeWidth="3.5" />
              <circle cx="170" cy="88" r="3.5" fill="#FFFFFF" />
              <circle cx="280" cy="45" r="3.5" fill="#FFFFFF" />
            </svg>
            <div className={styles.radarLegend}>
              <span className={styles.legendStart}>
                <i /> {id ? "Start: Check-in 1A" : "Start: Check-in 1A"}
              </span>
              <span className={styles.legendFinish}>
                <i /> {id ? "Tujuan: Boarding Gate 1" : "Dest: Boarding Gate 1"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: KONTROL TAMPILAN & MULTI-LANTAI */}
      {active === 3 && (
        <div className={styles.floorScene}>
          <div className={styles.controlsBarHud}>
            <div className={styles.controlGroup}>
              <span className={styles.controlGroupLabel}>{id ? "LANTAI" : "FLOOR"}</span>
              <div className={styles.pillGroup}>
                <button type="button" className={`${styles.deckPill} ${styles.deckPillActive}`}>
                  Lantai 1 (GF)
                </button>
                <button type="button" className={styles.deckPill}>
                  Lantai 2 (L2)
                </button>
              </div>
            </div>
            <div className={styles.controlGroup}>
              <span className={styles.controlGroupLabel}>{id ? "KAMERA POV" : "CAMERA POV"}</span>
              <div className={styles.pillGroup}>
                <button type="button" className={`${styles.deckPill} ${styles.deckPillActive}`}>
                  <Eye size={13} /> Visitor POV
                </button>
                <button type="button" className={styles.deckPill}>
                  <Compass size={13} /> Map View 3D
                </button>
              </div>
            </div>
          </div>

          <div className={styles.perspectiveStage}>
            <div className={styles.stageGrid}>
              <div className={styles.floorBlockConcourse}>
                <span>ZONE A · CHECK-IN & ARRIVAL (GF)</span>
              </div>
              <div className={styles.floorBlockGate}>
                <span>ZONE B · BOARDING GATES 1–12 (L2)</span>
              </div>
              <div className={styles.stairsConnector}>
                <span className={styles.connectorIcon}>⇅</span>
                <small>{id ? "Eskalator / Tangga L1 ↔ L2" : "Escalator / Stairs L1 ↔ L2"}</small>
              </div>
              <div className={styles.visitorAvatarPin}>
                <Navigation size={18} />
                <span className={styles.visitorVisionCone} />
                <small>{id ? "Posisi Anda" : "Your POV"}</small>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.previewBottom}>
        <span>
          <span className={styles.liveDot} />{" "}
          {id ? "DIGITAL TWIN ENGINE · WAYFINDING AKTIF" : "DIGITAL TWIN ENGINE · ACTIVE WAYFINDING"}
        </span>
        <span>0{active + 1} / 04</span>
      </div>
    </div>
  );
}

export function HelpPage() {
  const lang = useMapStore((state) => state.lang);
  const t = guides[lang];
  const [active, setActive] = useState(0);
  const current = t.steps[active];
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = pageRef.current;
    if (!container) return;

    const revealElements = container.querySelectorAll<HTMLElement>(".reveal-on-scroll");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className="page-fade-in" ref={pageRef}>
        <section className={styles.hero} aria-labelledby="help-title">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroOrbLeft} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <div className={styles.heroEyebrow}>
                <span className={styles.heroEyebrowDot} aria-hidden="true" />
                {lang === "ID" ? "PANDUAN WAYFINDING · TERMINAL 1" : "WAYFINDING GUIDE · TERMINAL 1"}
              </div>
              <h1 id="help-title">{t.title}</h1>
              <p>{t.intro}</p>
              <div className={styles.heroActions}>
                <a className={styles.primaryButton} href="#panduan">
                  <span>{t.start}</span>
                  <ArrowRight size={19} />
                </a>
                <Link className={styles.ghostButton} href="/map">
                  {t.map}
                  <ArrowRight size={17} />
                </Link>
              </div>
              <div className={styles.heroMeta} aria-label={lang === "ID" ? "Ringkasan panduan" : "Guide summary"}>
                <span><strong>04</strong> {lang === "ID" ? "langkah inti" : "core steps"}</span>
                <span className={styles.heroMetaDivider} aria-hidden="true" />
                <span><strong>3D</strong> {lang === "ID" ? "peta interaktif" : "interactive map"}</span>
              </div>
            </div>
            <div className={styles.heroArt} aria-hidden="true">
              <span className={styles.heroArtLabel}>TERMINAL WAYFINDING / 01—04</span>
              <svg viewBox="0 0 560 400" fill="none">
                <path className={styles.heroGrid} d="M20 55H540M20 145H540M20 235H540M20 325H540M85 20V380M200 20V380M320 20V380M440 20V380" />
                <path className={styles.heroTrack} d="M82 310H186V228H315V135H470V65" />
                <path className={styles.heroRoute} d="M82 310H186V228H315V135H470V65" />
                <circle cx="82" cy="310" r="18" fill="#0AA5DA" stroke="#D8F6FF" strokeWidth="7" />
                <circle cx="470" cy="65" r="18" fill="#34D3A0" stroke="#D9FFF1" strokeWidth="7" />
                <circle cx="315" cy="135" r="5" fill="white" />
              </svg>
              <span className={`${styles.heroLabel} ${styles.labelStart}`}>01 / START</span>
              <span className={`${styles.heroLabel} ${styles.labelFinish}`}>04 / DESTINATION</span>
            </div>
          </div>
        </section>

        <section className={`${styles.guideSection} reveal-on-scroll`} id="panduan" aria-labelledby="guide-title">
          <div className={styles.sectionHeading}>
            <span className={styles.kicker}>{t.sectionEyebrow}</span>
            <h2 id="guide-title">{t.sectionTitle}</h2>
            <p>{t.sectionIntro}</p>
          </div>
          <div className={styles.guideLayout}>
            <nav className={styles.stepNav} aria-label={lang === "ID" ? "Langkah panduan" : "Guide steps"}>
              <span className={styles.navCaption}>{lang === "ID" ? "ALUR PENGGUNAAN" : "YOUR JOURNEY"}</span>
              {t.steps.map((item, index) => {
                const Icon = icons[index];
                return (
                  <button
                    key={item.short}
                    type="button"
                    onClick={() => setActive(index)}
                    className={styles.stepButton}
                    data-active={active === index}
                    aria-current={active === index ? "step" : undefined}
                    aria-controls="step-content"
                  >
                    <span className={styles.stepIcon}>
                      <Icon size={21} strokeWidth={1.8} />
                    </span>
                    <span className={styles.stepButtonCopy}>
                      <small>0{index + 1}</small>
                      <strong>{item.short}</strong>
                    </span>
                    <ArrowRight className={styles.stepArrow} size={16} />
                  </button>
                );
              })}
              <span className={styles.navFoot}>
                {lang === "ID" ? "Klik langkah untuk melihat contoh" : "Select a step to see an example"}
              </span>
            </nav>
            <div className={styles.stepContent} id="step-content" aria-live="polite">
              <div className={styles.stepText} key={`text-${active}`}>
                <span className={styles.stepEyebrow}>
                  {t.step} 0{active + 1} <span className={styles.stepDash} /> 04
                </span>
                <h3>{current.title}</h3>
                <p>{current.desc}</p>
                <ul>
                  {current.tips.map((tip) => (
                    <li key={tip}>
                      <Check size={16} />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
                <Link className={styles.stepCta} href={current.href}>
                  {current.action}
                  <ArrowRight size={17} />
                </Link>
              </div>
              <div className={styles.previewWrap}>
                <div className={styles.previewHeading}>
                  <span>{t.preview}</span>
                  <span>{t.previewNote}</span>
                </div>
                <StepPreview active={active} lang={lang} />
              </div>
              <div className={styles.stepControls}>
                <span>0{active + 1} / 04</span>
                <div>
                  <button
                    type="button"
                    onClick={() => setActive((value) => Math.max(0, value - 1))}
                    disabled={active === 0}
                    aria-label={t.previous}
                  >
                    <ArrowLeft size={18} />
                    <span>{t.previous}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActive((value) => Math.min(3, value + 1))}
                    disabled={active === 3}
                    aria-label={t.next}
                  >
                    <span>{t.next}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <aside className={styles.notice}>
            <span className={styles.noticeIcon}>i</span>
            <div>
              <strong>{t.reminder}</strong>
              <p>{t.reminderText}</p>
            </div>
          </aside>
        </section>

        <section className={`${styles.passengerSection} reveal-on-scroll`} aria-labelledby="passenger-title">
          <div className={styles.passengerInner}>
            <div className={styles.passengerHeading}>
              <h2 id="passenger-title">{t.passengerTitle}</h2>
              <p>{t.passengerIntro}</p>
            </div>
            <ol className={styles.passengerSteps}>
              {t.passengerSteps.map((item, index) => (
                <li key={item.title} className={styles.passengerStep}>
                  <span className={styles.passengerNumber} aria-hidden="true">0{index + 1}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                  <span className={styles.passengerFloor}>{item.floor}</span>
                </li>
              ))}
            </ol>
            <p className={styles.passengerNote}>{t.passengerNote}</p>
          </div>
        </section>

        <section className={`${styles.faqSection} reveal-on-scroll`} aria-labelledby="faq-title">
          <div className={styles.faqInner}>
            <div className={styles.faqHeading}>
              <span className={styles.kicker}>{t.faqEyebrow}</span>
              <h2 id="faq-title">{t.faqTitle}</h2>
            </div>
            <div className={styles.faqList}>
              {t.faq.map((item, index) => (
                <details key={item.q}>
                  <summary>
                    <span>0{index + 1}</span>
                    <strong>{item.q}</strong>
                    <ChevronDown size={19} />
                  </summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.closing} reveal-on-scroll`}>
          <div>
            <span className={styles.kicker}>{t.closingEyebrow}</span>
            <h2>{t.closingTitle}</h2>
            <p>{t.closingText}</p>
          </div>
          <Link href="/map" className={styles.primaryButton}>
            {t.map}
            <ArrowRight size={19} />
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
