"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  CornerUpRight,
  Crosshair,
  Eye,
  Layers,
  LocateFixed,
  MapPin,
  Menu,
  Minus,
  MousePointer2,
  Navigation,
  Navigation2,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Trees,
  X,
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
        title: "Klik langsung di peta atau nyalakan GPS.",
        desc: "Untuk menetapkan posisi awal keberangkatan, Anda cukup mengeklik langsung lokasi, gedung, atau pintu masuk pada denah peta 3D (lalu pilih 'Start Here'), atau menyalakan GPS perangkat untuk mendeteksi posisi Anda saat ini secara otomatis.",
        tips: [
          "Klik langsung pada area, gedung, atau pintu masuk di peta untuk menetapkan titik awal.",
          "Nyalakan GPS perangkat Anda untuk bantuan penentuan posisi otomatis saat di bandara.",
        ],
        action: "Pilih posisi di peta",
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
        title: "Click directly on the map or enable GPS.",
        desc: "To set your starting location, simply click directly on any building, entrance, or area on the 3D map (then select 'Start Here'), or turn on your device's GPS to detect your current position automatically.",
        tips: [
          "Click any area, building, or entrance directly on the map to set your departure point.",
          "Enable your device's GPS for automatic location detection at the airport.",
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

const icons = [Search, LocateFixed, Navigation, Layers] as const;

function StepPreview({ active, lang }: { active: number; lang: "ID" | "EN" }) {
  const id = lang === "ID";
  return (
    <div className={styles.previewScene} key={active} aria-hidden="true">
      <div className={styles.previewTop}>
        <span className={styles.previewBrand}>
          BANDARA JUANDA T1 · <b>MAPS LIVE INTERFACE</b>
        </span>
        <div className={styles.previewDots}>
          <i />
          <i />
          <i />
        </div>
      </div>

      <div className={styles.mapCanvasViewport}>
        {/* STEP 1: FLOATING SEARCHBOX & CATEGORY CHIPS DARI HALAMAN MAPS */}
        {active === 0 && (
          <div className={styles.mapsSearchLayout}>
            {/* Real Search Box ala Google Maps di /map */}
            <div className={styles.gmapsSearchboxWrapper}>
              <div className={styles.gmapsSearchbox}>
                <button type="button" className={styles.gmapsMenuBtn} tabIndex={-1}>
                  <Menu size={16} />
                </button>
                <div className={styles.gmapsBrandPill}>
                  <img src="/icon.png" alt="ToDjuanda" className={styles.gmapsBrandLogo} />
                  <span className={styles.gmapsBrandTitle}>ToDjuanda</span>
                </div>
                <div className={styles.gmapsSearchInputMock}>
                  <span>Gate 1</span>
                </div>
                <button type="button" className={styles.gmapsIconBtn} tabIndex={-1}>
                  <X size={15} />
                </button>
                <div className={styles.gmapsSearchDivider} />
                <button type="button" className={styles.gmapsDirectionsTrigger} tabIndex={-1}>
                  <Navigation size={16} />
                </button>
              </div>

              {/* Floating Category Chips */}
              <div className={styles.gmapsCategoryChips}>
                <span className={`${styles.gmapsChip} ${styles.chipActive}`}>
                  <MapPin size={13} className={styles.chipIcon} />
                  <span>Gate 1–12</span>
                </span>
                <span className={styles.gmapsChip}>
                  <span>Check-in</span>
                </span>
                <span className={styles.gmapsChip}>
                  <span>Makanan & Minuman</span>
                </span>
                <span className={styles.gmapsChip}>
                  <span>Musala</span>
                </span>
              </div>

              {/* Dropdown Results ala /map */}
              <div className={styles.gmapsSearchDropdown}>
                <div className={`${styles.gmapsSearchItem} ${styles.itemHighlight}`}>
                  <div className={styles.gmapsItemIcon}>
                    <MapPin size={17} />
                  </div>
                  <div className={styles.gmapsItemInfo}>
                    <strong>Gate 1 - Keberangkatan Domestik</strong>
                    <small>{id ? "Terminal 1 · Lantai 2 (L2) · Ruang Tunggu Sayap Timur" : "Terminal 1 · Floor 2 (L2) · East Concourse"}</small>
                  </div>
                  <span className={styles.gmapsBadgeGate}>GATE</span>
                </div>
                <div className={styles.gmapsSearchItem}>
                  <div className={styles.gmapsItemIconMuted}>
                    <Navigation2 size={16} />
                  </div>
                  <div className={styles.gmapsItemInfo}>
                    <strong>Check-in Batik Air & Super Air Jet</strong>
                    <small>{id ? "Terminal 1 · Lantai Dasar (GF) · Baris A" : "Terminal 1 · Ground Floor (GF) · Row A"}</small>
                  </div>
                  <span className={styles.gmapsBadgeCheckin}>CHECK-IN</span>
                </div>
              </div>
            </div>

            {/* Floating Map Controls di Kanan Bawah */}
            <div className={styles.miniMapControls}>
              <div className={styles.miniCompassBtn}>
                <div className={styles.compassNeedle} />
              </div>
              <div className={styles.miniControlStack}>
                <span className={styles.miniCtrlBtn}><Plus size={14} /></span>
                <span className={styles.miniCtrlBtn}><Minus size={14} /></span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PLACE DETAILS CARD (KLIK PETA / GPS) DARI HALAMAN MAPS */}
        {active === 1 && (
          <div className={styles.mapsPlaceCardLayout}>
            {/* Marker terpilih pada denah peta */}
            <div className={styles.mapSelectedMarker}>
              <div className={styles.mapPinPulse} />
              <div className={styles.mapPinBubble}>
                <MapPin size={14} />
                <span>Pintu Masuk 1A</span>
              </div>
            </div>

            {/* Real Google Maps Place Card ala /map */}
            <aside className={styles.gmapsPlaceCard}>
              <div className={styles.placeCardTopBar}>
                <span className={styles.placeBadge}>
                  {id ? "FASILITAS BANDARA · TITIK AWAL" : "AIRPORT FACILITY · START POINT"}
                </span>
                <span className={styles.placeCloseBtn}><X size={15} /></span>
              </div>
              <div className={styles.placeContent}>
                <h4 className={styles.placeTitle}>Pintu Masuk 1A Keberangkatan</h4>
                <small className={styles.placeCode}>Blok: T1-GF-ENTRANCE-1A</small>
                <p className={styles.placeCategory}>
                  {id ? "Pintu Masuk Terminal 1 · Lantai 1 (Lantai Dasar)" : "Terminal 1 Entrance · Floor 1 (Ground Floor)"}
                </p>
                <div className={styles.placeStatus}>
                  <span className={styles.openPill}>{id ? "● Buka 24 Jam" : "● Open 24 Hours"}</span>
                </div>
                <div className={styles.placeActions}>
                  <button type="button" className={`${styles.gmapsBtnSecondary} ${styles.btnHighlight}`} tabIndex={-1}>
                    <MapPin size={15} />
                    <strong>Start Here</strong>
                  </button>
                  <button type="button" className={styles.gmapsBtnPrimary} tabIndex={-1}>
                    <Navigation size={15} />
                    <span>{id ? "Petunjuk Arah" : "Directions"}</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Floating GPS button indicator di kanan bawah */}
            <div className={styles.miniMapControls}>
              <div className={`${styles.miniGpsBtn} ${styles.gpsActive}`}>
                <LocateFixed size={18} />
              </div>
              <span className={styles.gpsStatusTag}>
                {id ? "GPS Aktif (±5m)" : "GPS Active (±5m)"}
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: DIRECTIONS PANEL & TURN-BY-TURN DARI HALAMAN MAPS */}
        {active === 2 && (
          <div className={styles.mapsDirectionsLayout}>
            {/* Real Google Maps Directions Panel ala /map */}
            <aside className={styles.gmapsDirectionsPanel}>
              <div className={styles.directionsHeader}>
                <span className={styles.directionsBackBtn}><ArrowLeft size={17} /></span>
                <h4>{id ? "Petunjuk Arah" : "Directions"}</h4>
                <span className={styles.directionsSwapBtn}><ArrowUpDown size={16} /></span>
              </div>

              <div className={styles.directionsBody}>
                {/* Inputs Origin & Destination */}
                <div className={styles.gmapsInputsContainer}>
                  <div className={styles.gmapsInputRow}>
                    <span className={styles.dotOrigin} />
                    <div className={styles.inputBtnMock}>
                      <small>{id ? "DARI" : "FROM"}</small>
                      <span>Pintu Masuk 1A Keberangkatan</span>
                    </div>
                  </div>
                  <div className={styles.inputConnectorLine} />
                  <div className={styles.gmapsInputRow}>
                    <span className={styles.dotDest} />
                    <div className={styles.inputBtnMock}>
                      <small>{id ? "TUJUAN" : "TO"}</small>
                      <span>Gate 1 - Keberangkatan Domestik</span>
                    </div>
                  </div>
                </div>

                {/* Estimate Row */}
                <div className={styles.routeTimeEstimateRow}>
                  <div className={styles.timeEstimate}>
                    <strong>{id ? "3 Menit" : "3 Minutes"}</strong>
                    <span>(185 m · Lantai 1 ➔ Lantai 2)</span>
                  </div>
                </div>

                {/* Turn-by-turn guidance steps list */}
                <div className={styles.directionsStepsList}>
                  <div className={`${styles.stepRowItem} ${styles.stepRowActive}`}>
                    <span className={styles.stepNumBadge}>1</span>
                    <div className={styles.stepRowText}>
                      <strong>{id ? "Lurus di koridor utama (50 m)" : "Walk straight on main corridor (50 m)"}</strong>
                      <small>{id ? "Menuju eskalator Lantai 2" : "Towards Floor 2 escalator"}</small>
                    </div>
                    <CornerUpRight size={15} className={styles.stepTurnIcon} />
                  </div>
                  <div className={styles.stepRowItem}>
                    <span className={styles.stepNumBadge}>2</span>
                    <div className={styles.stepRowText}>
                      <strong>{id ? "Naik eskalator ke Lantai 2 (15 m)" : "Take escalator to Floor 2 (15 m)"}</strong>
                      <small>{id ? "Konektor lantai keberangkatan" : "Departure level connector"}</small>
                    </div>
                    <Layers size={15} className={styles.stepTurnIcon} />
                  </div>
                  <div className={styles.stepRowItem}>
                    <span className={styles.stepNumBadge}>3</span>
                    <div className={styles.stepRowText}>
                      <strong>{id ? "Tiba di Boarding Gate 1" : "Arrive at Boarding Gate 1"}</strong>
                      <small>{id ? "Ruang tunggu sayap timur" : "East concourse waiting lounge"}</small>
                    </div>
                    <MapPin size={15} className={styles.stepTurnIcon} />
                  </div>
                </div>
              </div>
            </aside>

            {/* Glowing Wayfinding Path in background */}
            <div className={styles.routeCanvasOverlay}>
              <svg className={styles.canvasPathSvg} viewBox="0 0 540 180" fill="none">
                <path className={styles.corridorTrack} d="M30 45H170V95H290V45H500M50 145H170V95H400V145H500M90 20V165M440 20V165" />
                <path className={styles.activeRouteGlow} d="M80 145H170V95H290V50H440V30" />
                <circle cx="80" cy="145" r="9" fill="#10B981" stroke="#FFFFFF" strokeWidth="3" />
                <circle cx="440" cy="30" r="9" fill="#00C6F4" stroke="#FFFFFF" strokeWidth="3" />
              </svg>
            </div>
          </div>
        )}

        {/* STEP 4: KONTROL TAMPILAN POV & FLOOR SWITCHER DARI HALAMAN MAPS */}
        {active === 3 && (
          <div className={styles.mapsControlsLayout}>
            {/* View Mode Switcher Pill on Top ala /map */}
            <div className={styles.viewModeSwitcherBar}>
              <button type="button" className={`${styles.modePillBtn} ${styles.modePillActive}`} tabIndex={-1}>
                <Eye size={14} />
                <span>Visitor POV</span>
              </button>
              <button type="button" className={styles.modePillBtn} tabIndex={-1}>
                <Compass size={14} />
                <span>Map View 3D</span>
              </button>
            </div>

            {/* Floor Switcher Vertical Stack ala FloorSwitcher di /map */}
            <div className={styles.gmapsFloorSwitcher}>
              <button type="button" className={styles.floorBtnItem} tabIndex={-1}>
                <span>L2</span>
                <span className={styles.floorTooltip}>Lantai 2 - Gate 1–12</span>
              </button>
              <button type="button" className={`${styles.floorBtnItem} ${styles.floorBtnActive}`} tabIndex={-1}>
                <span>L1</span>
                <span className={styles.floorTooltip}>Lantai 1 - Check-in & Kedatangan</span>
              </button>
              <button type="button" className={styles.floorBtnItem} tabIndex={-1}>
                <span>ALL</span>
                <span className={styles.floorTooltip}>Semua Lantai</span>
              </button>
            </div>

            {/* Bottom Controls di Kanan Bawah ala /map */}
            <div className={styles.gmapsBottomControlsStack}>
              <div className={styles.miniCompassBtn}>
                <div className={styles.compassNeedle} />
              </div>
              <div className={styles.gmapsControlStack}>
                <button type="button" className={`${styles.gmapsCtrlBtn} ${styles.ctrlActive}`} tabIndex={-1}>
                  <LocateFixed size={18} />
                </button>
                <button type="button" className={styles.gmapsCtrlBtn} tabIndex={-1}>
                  <Plus size={18} />
                </button>
                <button type="button" className={styles.gmapsCtrlBtn} tabIndex={-1}>
                  <Minus size={18} />
                </button>
                <button type="button" className={styles.gmapsCtrlBtn} tabIndex={-1}>
                  <Trees size={18} />
                </button>
              </div>
            </div>

            {/* Center Stage: First Person Walking Perspective Avatar */}
            <div className={styles.povCenterStage}>
              <div className={styles.povGridPlane}>
                <div className={styles.povCorridorLabel}>
                  <span>KORIDOR UTAMA TERMINAL 1 (GF)</span>
                </div>
                <div className={styles.povAvatarIndicator}>
                  <div className={styles.povVisionCone} />
                  <Navigation size={22} className={styles.povAvatarArrow} />
                  <span className={styles.povLabelTag}>{id ? "Pandangan Anda" : "Your POV"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.previewBottom}>
        <span>
          <span className={styles.liveDot} />{" "}
          {id ? "ANTARMUKA ASLI PETA 3D JUANDA T1" : "JUANDA T1 3D MAPS INTERFACE"}
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
      <main className={styles.mainContent} ref={pageRef}>
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
              <div className={styles.heroArtHeader}>
                <span className={styles.heroArtBrand}>
                  <Radio size={15} className={styles.heroArtRadioPulse} />
                  <span>{lang === "ID" ? "Peta Rute Interaktif T1 Juanda" : "Juanda T1 Interactive Wayfinding"}</span>
                </span>
                <span className={styles.heroArtBadge}>
                  {lang === "ID" ? "LIVE 3D ENGINE" : "LIVE 3D ENGINE"}
                </span>
              </div>

              <div className={styles.heroArtCanvas}>
                <svg viewBox="0 0 560 310" fill="none">
                  <path className={styles.heroGrid} d="M20 50H540M20 130H540M20 210H540M20 280H540M85 20V290M200 20V290M320 20V290M440 20V290" />
                  <path className={styles.heroTrack} d="M82 250H186V170H315V95H470V45" />
                  <path className={styles.heroRoute} d="M82 250H186V170H315V95H470V45" />
                  <circle cx="82" cy="250" r="15" fill="#0AA5DA" stroke="#D8F6FF" strokeWidth="5" />
                  <circle cx="470" cy="45" r="15" fill="#10B981" stroke="#D9FFF1" strokeWidth="5" />
                  <circle cx="315" cy="95" r="4.5" fill="white" />
                </svg>
                <span className={`${styles.heroLabel} ${styles.labelStart}`}>01 / CHECK-IN</span>
                <span className={`${styles.heroLabel} ${styles.labelFinish}`}>04 / BOARDING GATE</span>
              </div>

              <div className={styles.heroArtPills}>
                <div className={styles.heroArtPill}>
                  <Search size={14} />
                  <span>{lang === "ID" ? "01 Cari Lokasi" : "01 Search Location"}</span>
                </div>
                <div className={styles.heroArtPill}>
                  <MapPin size={14} />
                  <span>{lang === "ID" ? "02 Klik Peta / GPS" : "02 Map Click / GPS"}</span>
                </div>
                <div className={styles.heroArtPill}>
                  <Navigation size={14} />
                  <span>{lang === "ID" ? "03 Ikuti Rute" : "03 Follow Route"}</span>
                </div>
                <div className={styles.heroArtPill}>
                  <Layers size={14} />
                  <span>{lang === "ID" ? "04 POV & Lantai" : "04 POV & Floors"}</span>
                </div>
              </div>
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
