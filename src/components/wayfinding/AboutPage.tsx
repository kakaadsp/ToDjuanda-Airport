"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  Footprints,
  HeartHandshake,
  Layers,
  Luggage,
  MapPin,
  Navigation2,
  Plane,
  PlaneTakeoff,
  Radio,
  Route,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useMapStore } from "@/store/mapStore";
import styles from "./AboutPage.module.css";

const OverviewMap = dynamic(
  () => import("@/components/map2d/JuandaOverviewMap").then((module) => module.JuandaOverviewMap),
  { ssr: false },
);

const aboutContent = {
  ID: {
    heroEyebrow: "INJOURNEY AIRPORTS · JUANDA SUB T1",
    heroTitlePrefix: "Navigasi Digital Twin ",
    heroTitleAccent: "Bandara Internasional Juanda",
    heroDesc:
      "Platform wayfinding 3D indoor resmi Terminal 1 Juanda. Panduan rute cerdas belokan demi belokan dari konter check-in langsung ke boarding gate.",
    openMap: "Buka Peta 3D",
    openGuide: "Panduan Cepat",
    stats: [
      { val: "2 Lantai", label: "T1 Terpadu", icon: Layers },
      { val: "100% Web", label: "Tanpa Instalasi", icon: Zap },
      { val: "72 m/mnt", label: "Kecepatan Jalan", icon: Footprints },
      { val: "Gate 1–15", label: "Pintu Boarding", icon: Plane },
    ],
    showcase: {
      brand: "Peta Satelit T1 Juanda",
      status: "LIVE 2D RADAR",
      caption: "Klik area Terminal 1 untuk masuk peta 3D interaktif",
      pills: [
        { label: "Pintu Masuk & Check-in", icon: "building" },
        { label: "Gate Keberangkatan 1-12", icon: "plane" },
        { label: "Konektor Eskalator/Tangga", icon: "layers" },
        { label: "83+ Tenant & Fasilitas", icon: "search" },
      ],
    },
    visionSection: {
      eyebrow: "NILAI UNGGULAN",
      title: "Solusi Navigasi Bebas Bingung di Terminal 1",
      lead: "Menghilangkan kecemasan tertinggal pesawat dengan kepastian arah dan visual gedung yang nyata.",
      hudKicker: "MISI & AKURASI",
      hudTitle: "Digital Twin Presisi Tinggi",
      hudPills: ["Akurasi Koridor 100%", "Multi-Lantai L1 & L2", "Akses Cepat 0 Detik"],
      hudStats: [
        { value: "0 Detik", label: "Tanpa Unduh App" },
        { value: "83+ Titik", label: "Fasilitas Terdata" },
        { value: "100%", label: "Rute Terverifikasi" },
      ],
      benefits: [
        {
          badge: "VISUAL NYATA",
          title: "Orientasi Spasial 3D",
          desc: "Bentuk gedung dan koridor divisualisasikan sesuai fisik aslinya.",
          icon: Compass,
        },
        {
          badge: "JALUR RESMI",
          title: "Rute Fisik Terverifikasi",
          desc: "Hanya melewati jalur pejalan kaki, tangga, dan eskalator resmi.",
          icon: Route,
        },
        {
          badge: "BEBAS PANIK",
          title: "Estimasi Jarak & Menit (ETA)",
          desc: "Ketahui jarak meter riil dan menit jalan santai menuju gate Anda.",
          icon: Clock,
        },
      ],
    },
    featuresSection: {
      eyebrow: "4 PILAR FITUR CERDAS",
      title: "Teknologi Modern untuk Setiap Penumpang",
      desc: "Dirancang seringan mungkin agar dapat diakses seketika dari browser HP tanpa hambatan.",
      items: [
        {
          tag: "DIGITAL TWIN 3D",
          title: "Denah 3D Multi-Lantai",
          desc: "Visualisasi interaktif Lantai 1 & Lantai 2 dengan kamera putar 360° yang sangat responsif.",
          chips: ["Lantai 1 & 2", "Orbit 360°", "Garbarata 3D"],
          link: "Eksplorasi Peta",
          href: "/map",
          icon: Layers,
        },
        {
          tag: "SMART ROUTING",
          title: "Navigasi Turn-by-Turn",
          desc: "Kalkulasi rute terpendek dengan deteksi arah eskalator (naik/turun) dan tangga antarlantai.",
          chips: ["Jalur Terpendek", "Eskalator Terarah", "ETA Berjalan"],
          link: "Coba Rute",
          href: "/map",
          icon: Navigation2,
        },
        {
          tag: "OMNI-SEARCH",
          title: "Direktori & Fasilitas Cepat",
          desc: "Temukan Gate 1-15, konter maskapai, musholla, toilet, ATM, dan resto dalam 1 sentuhan.",
          chips: ["Gate 1–15", "Toilet & Musholla", "Resto & ATM"],
          link: "Cari Tempat",
          href: "/map",
          icon: Search,
        },
        {
          tag: "UNIVERSAL WEB",
          title: "Akses Instan Tanpa Install",
          desc: "Cukup pindai QR code di standing banner atau kiosk bandara untuk langsung mulai navigasi.",
          chips: ["Scan QR", "Ringan & Cepat", "HP & Kiosk"],
          link: "Buka Panduan",
          href: "/help",
          icon: Smartphone,
        },
      ],
    },
    airportFacts: {
      eyebrow: "OPERASIONAL TERMINAL 1",
      title: "Gerbang Udara Utama Jawa Timur",
      desc: "Pusat mobilitas penerbangan domestik tersibuk yang dikelola oleh InJourney Airports.",
      cards: [
        {
          num: "01",
          icon: PlaneTakeoff,
          title: "30+ Kota Domestik",
          desc: "Konektivitas luas menghubungkan Surabaya ke seluruh penjuru Nusantara setiap hari.",
        },
        {
          num: "02",
          icon: Building2,
          title: "Infrastruktur 2 Lantai",
          desc: "Lantai 1 Check-in Departure 1–4 & Kedatangan · Lantai 2 Ruang Tunggu Gate 1–15.",
        },
        {
          num: "03",
          icon: ShieldCheck,
          title: "Standar Layanan 3S+1C",
          desc: "Safety, Security, Services & Compliance berstandar internasional demi kenyamanan penumpang.",
        },
        {
          num: "04",
          icon: HeartHandshake,
          title: "83+ Mitra Fasilitas",
          desc: "Kuliner khas Jawa Timur, toko ritel, perbankan, ruang laktasi, dan toilet disabilitas.",
        },
      ],
    },
    closing: {
      eyebrow: "SIAP MENJELAJAHI JUANDA?",
      title: "Mulai Navigasi Perjalanan Anda Sekarang",
      desc: "Buka peta 3D interaktif atau pelajari panduan ringkas penggunaan hanya dalam hitungan detik.",
      buttonMap: "Mulai Peta 3D",
      buttonGuide: "Buku Panduan",
    },
  },
  EN: {
    heroEyebrow: "INJOURNEY AIRPORTS · JUANDA SUB T1",
    heroTitlePrefix: "Digital Twin Wayfinding ",
    heroTitleAccent: "Juanda International Airport",
    heroDesc:
      "Official 3D indoor navigation for Juanda Terminal 1. Turn-by-turn guidance connecting check-in desks directly to boarding gates.",
    openMap: "Open 3D Map",
    openGuide: "Quick Guide",
    stats: [
      { val: "2 Levels", label: "Integrated T1", icon: Layers },
      { val: "100% Web", label: "No App Install", icon: Zap },
      { val: "72 m/min", label: "Walking Pace", icon: Footprints },
      { val: "Gates 1–12", label: "Boarding Gates", icon: Plane },
    ],
    showcase: {
      brand: "T1 Juanda Satellite Radar",
      status: "LIVE 2D RADAR",
      caption: "Click Terminal 1 area to enter interactive 3D map",
      pills: [
        { label: "Entrance & Check-in", icon: "building" },
        { label: "Boarding Gates 1-12", icon: "plane" },
        { label: "Escalator & Stair Links", icon: "layers" },
        { label: "83+ Directory Facilities", icon: "search" },
      ],
    },
    visionSection: {
      eyebrow: "CORE VALUES",
      title: "Stress-Free Navigation in Terminal 1",
      lead: "Eliminating airport anxiety with verified pedestrian paths and real 3D spatial models.",
      hudKicker: "MISSION & PRECISION",
      hudTitle: "High-Precision Digital Twin",
      hudPills: ["100% Corridor Accuracy", "Multi-Floor Levels 1 & 2", "Instant 0-Sec Access"],
      hudStats: [
        { value: "0 sec", label: "No App Install" },
        { value: "83+ Nodes", label: "Mapped Facilities" },
        { value: "100%", label: "Verified Routing" },
      ],
      benefits: [
        {
          badge: "REAL 3D",
          title: "Intuitive 3D Orientation",
          desc: "Understand level layouts and corridors exactly as built in reality.",
          icon: Compass,
        },
        {
          badge: "OFFICIAL PATH",
          title: "Verified Pedestrian Paths",
          desc: "Strictly routes through official walkways, stairs, and escalators.",
          icon: Route,
        },
        {
          badge: "CALM PACE",
          title: "Punctual Distance & ETA",
          desc: "View actual meter distance and relaxed walking minutes to your gate.",
          icon: Clock,
        },
      ],
    },
    featuresSection: {
      eyebrow: "4 SMART PILLARS",
      title: "Modern Tech for Every Passenger",
      desc: "Built to be lightweight and accessible instantly from mobile browsers.",
      items: [
        {
          tag: "DIGITAL TWIN 3D",
          title: "Multi-Floor 3D Layout",
          desc: "Interactive visualization of Levels 1 & 2 with smooth 360° orbit camera controls.",
          chips: ["Levels 1 & 2", "360° Orbit", "3D Jetbridges"],
          link: "Explore Map",
          href: "/map",
          icon: Layers,
        },
        {
          tag: "SMART ROUTING",
          title: "Turn-by-Turn Guidance",
          desc: "Shortest route calculation with directional escalator (up/down) and stair support.",
          chips: ["Shortest Path", "Directional Escalators", "Walking ETA"],
          link: "Try Navigation",
          href: "/map",
          icon: Navigation2,
        },
        {
          tag: "OMNI-SEARCH",
          title: "Instant Facility Search",
          desc: "Locate Gates 1–12, airline counters, prayer rooms, restrooms, ATMs, and dining.",
          chips: ["Gates 1–12", "Restrooms & Prayer", "Dining & ATM"],
          link: "Find Places",
          href: "/map",
          icon: Search,
        },
        {
          tag: "UNIVERSAL WEB",
          title: "Zero-Install Web Access",
          desc: "Scan QR codes on terminal kiosks or banners to start navigating immediately.",
          chips: ["Scan QR", "Fast & Responsive", "Mobile & Kiosk"],
          link: "Read Guide",
          href: "/help",
          icon: Smartphone,
        },
      ],
    },
    airportFacts: {
      eyebrow: "OPERATIONAL PROFILE",
      title: "East Java's Premier Aviation Hub",
      desc: "The busiest domestic hub managed by PT Angkasa Pura Indonesia (InJourney Airports).",
      cards: [
        {
          num: "01",
          icon: PlaneTakeoff,
          title: "30+ Domestic Cities",
          desc: "Extensive routes connecting Surabaya to cities across the Indonesian archipelago.",
        },
        {
          num: "02",
          icon: Building2,
          title: "2 Integrated Levels",
          desc: "Level 1 Check-in Departure 1–4 & Arrivals · Level 2 Boarding Gates 1–12 Lounges.",
        },
        {
          num: "03",
          icon: ShieldCheck,
          title: "InJourney 3S+1C Standard",
          desc: "Safety, Security, Services & Compliance for world-class passenger satisfaction.",
        },
        {
          num: "04",
          icon: HeartHandshake,
          title: "83+ Facility Partners",
          desc: "East Java culinary icons, retail shops, banking, nursing, and accessibility rooms.",
        },
      ],
    },
    closing: {
      eyebrow: "READY TO EXPLORE JUANDA?",
      title: "Begin Your Terminal Navigation Now",
      desc: "Open the interactive 3D map or read the quick visual guide in seconds.",
      buttonMap: "Launch 3D Map",
      buttonGuide: "User Guide",
    },
  },
};

export function AboutPage() {
  const store = useMapStore();
  const lang = store.lang;
  const content = aboutContent[lang] ?? aboutContent.ID;
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.isRevealed);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );

    const elements = document.querySelectorAll(`.${styles.revealOnScroll}`);
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className={styles.aboutPage}>
      <SiteHeader />

      <main className={styles.mainContent}>
        {/* =========================================
            HERO SECTION WITH VISUAL GRADIENTS & 2D RADAR MAP
            ========================================= */}
        <section className={styles.hero} aria-labelledby="about-hero-title">
          {/* Animated Ambient Gradient Orbs */}
          <div className={styles.heroOrb1} aria-hidden="true" />
          <div className={styles.heroOrb2} aria-hidden="true" />
          <div className={styles.heroGridLines} aria-hidden="true" />

          <div className={styles.heroInner}>
            <div className={`${styles.heroCopy} ${styles.revealOnScroll}`}>
              <div className={styles.heroEyebrow}>
                <span className={styles.heroEyebrowDot} />
                <span>{content.heroEyebrow}</span>
              </div>

              <h1 id="about-hero-title">
                {content.heroTitlePrefix}
                <span className={styles.heroGradientText}>{content.heroTitleAccent}</span>
              </h1>

              <p>{content.heroDesc}</p>

              <div className={styles.heroActions}>
                <Link href="/map" className={styles.primaryButton}>
                  <Compass size={22} />
                  <span>{content.openMap}</span>
                  <ArrowRight size={19} />
                </Link>
                <Link href="/help" className={styles.ghostButton}>
                  <Sparkles size={19} />
                  <span>{content.openGuide}</span>
                </Link>
              </div>
            </div>

            {/* Showcase Visual Card (2D Overview Radar Map) */}
            <div className={`${styles.heroShowcase} ${styles.revealOnScroll} ${styles.revealDelay1}`}>
              <div className={styles.showcaseCard}>
                <div className={styles.showcaseHeader}>
                  <div className={styles.showcaseBrand}>
                    <Radio size={17} className={styles.pulseRadio} />
                    <span>{content.showcase.brand}</span>
                  </div>
                  <span className={styles.showcaseBadge}>{content.showcase.status}</span>
                </div>

                {/* 2D Overview Map Frame */}
                <div className={styles.showcaseMapWrap}>
                  <OverviewMap />
                  <span className={styles.showcaseMapCaption}>
                    {content.showcase.caption}
                  </span>
                </div>

                <div className={styles.showcasePills}>
                  {content.showcase.pills.map((pill, idx) => (
                    <div key={idx} className={styles.showcasePill}>
                      <span className={styles.showcasePillIcon}>
                        {pill.icon === "building" && <Building2 size={14} />}
                        {pill.icon === "plane" && <PlaneTakeoff size={14} />}
                        {pill.icon === "layers" && <Layers size={14} />}
                        {pill.icon === "search" && <Search size={14} />}
                      </span>
                      <span>{pill.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            VALUES & VISUAL HUD CAPABILITY SECTION
            ========================================= */}
        <section className={styles.visionSection} aria-label="Nilai Keunggulan">
          <div className={styles.container}>
            <div className={`${styles.sectionHeader} ${styles.revealOnScroll}`}>
              <div className={styles.sectionEyebrow}>
                <Sparkles size={14} />
                <span>{content.visionSection.eyebrow}</span>
              </div>
              <h2 className={styles.sectionTitle}>{content.visionSection.title}</h2>
              <p className={styles.sectionDesc}>{content.visionSection.lead}</p>
            </div>

            <div className={styles.visionGrid}>
              {/* Left Column: Visual Airport Tech HUD Card */}
              <div className={`${styles.hudCard} ${styles.revealOnScroll} ${styles.revealDelay1}`}>
                <div className={styles.hudCardGlow} aria-hidden="true" />
                <div className={styles.hudWatermark} aria-hidden="true">
                  <svg viewBox="0 0 400 300" fill="none">
                    <circle cx="200" cy="150" r="140" stroke="rgba(56, 189, 248, 0.12)" strokeDasharray="4 4" />
                    <circle cx="200" cy="150" r="95" stroke="rgba(56, 189, 248, 0.16)" />
                    <circle cx="200" cy="150" r="45" stroke="rgba(56, 189, 248, 0.22)" />
                    <line x1="20" y1="150" x2="380" y2="150" stroke="rgba(56, 189, 248, 0.1)" />
                    <line x1="200" y1="10" x2="200" y2="290" stroke="rgba(56, 189, 248, 0.1)" />
                    <path d="M200 150 L330 60" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.4" />
                  </svg>
                </div>

                <div className={styles.hudCardInner}>
                  <div className={styles.hudTop}>
                    <span className={styles.hudKicker}>{content.visionSection.hudKicker}</span>
                    <div className={styles.hudLiveBadge}>
                      <span className={styles.beaconDot} />
                      <span>VERIFIED SUB</span>
                    </div>
                  </div>

                  <h3 className={styles.hudTitle}>{content.visionSection.hudTitle}</h3>

                  <div className={styles.hudPillTags}>
                    {content.visionSection.hudPills.map((tag, tIdx) => (
                      <span key={tIdx} className={styles.hudTag}>
                        <CheckCircle2 size={13} />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className={styles.hudStatsGrid}>
                    {content.visionSection.hudStats.map((st, sIdx) => (
                      <div key={sIdx} className={styles.hudStatBox}>
                        <strong>{st.value}</strong>
                        <span>{st.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: 3 Compact Capability Cards */}
              <div className={`${styles.visionCardsCol} ${styles.revealOnScroll} ${styles.revealDelay2}`}>
                {content.visionSection.benefits.map((b, idx) => {
                  const Icon = b.icon;
                  return (
                    <div key={idx} className={styles.benefitCard} data-index={idx}>
                      <div className={styles.benefitAccent} aria-hidden="true" />
                      <div className={styles.benefitIconWrap}>
                        <Icon size={22} />
                      </div>
                      <div className={styles.benefitBody}>
                        <div className={styles.benefitHeader}>
                          <h4>{b.title}</h4>
                          <span className={styles.benefitBadge}>{b.badge}</span>
                        </div>
                        <p>{b.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            4 SMART PILLARS (BENTO GLASS CARDS)
            ========================================= */}
        <section className={styles.featuresSection} aria-label="Fitur Unggulan">
          <div className={styles.container}>
            <div className={`${styles.sectionHeader} ${styles.revealOnScroll}`}>
              <div className={styles.sectionEyebrow}>
                <Layers size={14} />
                <span>{content.featuresSection.eyebrow}</span>
              </div>
              <h2 className={styles.sectionTitle}>{content.featuresSection.title}</h2>
              <p className={styles.sectionDesc}>{content.featuresSection.desc}</p>
            </div>

            <div className={styles.featuresBentoGrid}>
              {content.featuresSection.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <article key={idx} className={`${styles.bentoCard} ${styles.revealOnScroll}`} data-pillar={idx}>
                    <div className={styles.bentoCardGlow} aria-hidden="true" />
                    <span className={styles.bentoWatermarkNum} aria-hidden="true">0{idx + 1}</span>
                    <div className={styles.bentoTop}>
                      <div className={styles.bentoIconWrap}>
                        <Icon size={24} />
                      </div>
                      <span className={styles.bentoTag}>{item.tag}</span>
                    </div>

                    <h3 className={styles.bentoTitle}>{item.title}</h3>
                    <p className={styles.bentoDesc}>{item.desc}</p>

                    <div className={styles.bentoChips}>
                      {item.chips.map((chip, cIdx) => (
                        <span key={cIdx} className={styles.bentoChip}>
                          {chip}
                        </span>
                      ))}
                    </div>

                    <div className={styles.bentoFooter}>
                      <Link href={item.href} className={styles.bentoLink}>
                        <span>{item.link}</span>
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================
            AIRPORT OPERATIONAL FACTS (HUD FACT CARDS)
            ========================================= */}
        <section className={styles.airportSection} aria-label="Profil Operasional Terminal 1">
          <div className={styles.container}>
            <div className={`${styles.sectionHeader} ${styles.revealOnScroll}`}>
              <div className={styles.sectionEyebrow}>
                <Building2 size={14} />
                <span>{content.airportFacts.eyebrow}</span>
              </div>
              <h2 className={styles.sectionTitle}>{content.airportFacts.title}</h2>
              <p className={styles.sectionDesc}>{content.airportFacts.desc}</p>
            </div>

            <div className={styles.airportGrid}>
              {content.airportFacts.cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div key={idx} className={`${styles.airportCard} ${styles.revealOnScroll}`} data-fact={idx}>
                    <div className={styles.airportCardBar} aria-hidden="true" />
                    <div className={styles.airportCardHeader}>
                      <span className={styles.airportCardNum}>{card.num}</span>
                      <div className={styles.airportCardIconWrap}>
                        <Icon size={22} />
                      </div>
                    </div>
                    <h3 className={styles.airportCardTitle}>{card.title}</h3>
                    <p className={styles.airportCardDesc}>{card.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================
            CLOSING CTA SECTION
            ========================================= */}
        <section className={styles.closing} aria-label="Mulai Menjelajahi">
          <div className={styles.closingGlow} aria-hidden="true" />
          <div className={`${styles.closingCopy} ${styles.revealOnScroll}`}>
            <span className={styles.closingEyebrow}>{content.closing.eyebrow}</span>
            <h2>{content.closing.title}</h2>
            <p>{content.closing.desc}</p>
          </div>

          <div className={`${styles.closingActions} ${styles.revealOnScroll} ${styles.revealDelay1}`}>
            <Link href="/map" className={styles.primaryButton}>
              <Compass size={18} />
              <span>{content.closing.buttonMap}</span>
              <ArrowRight size={16} />
            </Link>
            <Link href="/help" className={styles.ghostButton}>
              <span>{content.closing.buttonGuide}</span>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
