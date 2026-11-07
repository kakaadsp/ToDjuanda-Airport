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
  HeartHandshake,
  Layers,
  Luggage,
  MapPin,
  Plane,
  PlaneTakeoff,
  Route,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
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
    heroEyebrow: "TENTANG TODJUANDA · INJOURNEY AIRPORTS",
    heroTitlePrefix: "Inovasi Navigasi Digital Twin di ",
    heroTitleAccent: "Bandara Internasional Juanda",
    heroDesc:
      "ToDjuanda adalah platform navigasi dalam ruangan (indoor wayfinding) 3D interaktif pertama yang dirancang khusus untuk memandu jutaan penumpang Terminal 1 Bandara Internasional Juanda Surabaya (SUB). Menghubungkan titik awal Anda ke gate keberangkatan, konter maskapai, dan fasilitas penting secara presisi, cepat, dan bebas stres.",
    openMap: "Buka Peta 3D",
    openGuide: "Panduan Penggunaan",
    stats: {
      floors: "2 Lantai Terpadu",
      floorsSub: "Lantai 1 & Lantai 2",
      web: "100% Web-Based",
      webSub: "Akses Tanpa Aplikasi",
      speed: "72 m/menit",
      speedSub: "Estimasi Waktu Tempuh",
      gates: "Gate 1 – 12",
      gatesSub: "Pintu Keberangkatan",
    },
    showcase: {
      brand: "Peta Bandara Juanda",
      status: "Peta Satelit 2D",
      caption: "Klik Terminal 1 untuk masuk ke peta 3D interaktif",
      pills: [
        { label: "Pintu Masuk & Check-in", icon: "building" },
        { label: "Gate Keberangkatan 1-12", icon: "plane" },
        { label: "Konektor Eskalator/Tangga", icon: "layers" },
        { label: "Direktori F&B & Fasilitas", icon: "search" },
      ],
    },
    visionSection: {
      eyebrow: "LATAR BELAKANG & VISI",
      title: "Menghadirkan Perjalanan Bandara yang Tenang dan Bebas Stres",
      lead:
        "Bandara Internasional Juanda (SUB) di bawah naungan PT Angkasa Pura Indonesia (InJourney Airports) melayani puluhan ribu penumpang setiap hari di Terminal 1. Di dalam gedung seluas puluhan ribu meter persegi, kepastian arah dan efisiensi waktu adalah kunci ketenangan setiap pelancong menjelang penerbangan.",
      cardKicker: "MISI & KOMITMEN KAMI",
      cardTitle: "Navigasi Cepat, Akurat, dan Ramah Pengguna",
      cardDesc:
        "Sering kali penumpang menghadapi ketegangan mengejar boarding gate, bingung mencari eskalator menuju ruang tunggu lantai 2, atau kesulitan menemukan fasilitas penting seperti musholla dan toilet. ToDjuanda menghadirkan denah 3D nyata dan rute belokan otomatis agar setiap penumpang melangkah dengan percaya diri dari drop zone hingga boarding pesawat.",
      cardStats: [
        { value: "0 Detik", label: "Tanpa unduh aplikasi tambahan" },
        { value: "100%", label: "Cakupan area publik Terminal 1" },
        { value: "Multi-Lantai", label: "Rute terhubung Lantai 1 & 2" },
      ],
      benefits: [
        {
          badge: "Visual 3D Nyata",
          title: "Orientasi Spasial yang Mudah",
          desc: "Visualisasi 3D realistis membantu penumpang memahami bentuk fisik gedung terminal, posisi lantai, dan koridor secara nyata.",
        },
        {
          badge: "Rute Terverifikasi",
          title: "Jalur Pejalan Kaki Resmi",
          desc: "Perhitungan rute hanya melewati koridor pejalan kaki, tangga, dan eskalator terarah tanpa rute mustahil menembus dinding.",
        },
        {
          badge: "Tepat Waktu",
          title: "Kepastian Menjelang Penerbangan",
          desc: "Ketahui jarak meter riil dan perkiraan menit berjalan santai menuju boarding gate agar Anda tidak tertinggal pesawat.",
        },
      ],
    },
    featuresSection: {
      eyebrow: "FITUR UNGGULAN",
      title: "Dirancang Cerdas untuk Segala Kebutuhan Penumpang",
      desc: "Setiap fitur ToDjuanda dibangun dengan fokus pada kemudahan interaksi, kecepatan akses, dan akurasi informasi fasilitas terminal.",
      items: [
        {
          tag: "DIGITAL TWIN 3D",
          title: "Denah 3D Multi-Lantai Terpadu",
          desc: "Menampilkan denah Terminal 1 Juanda (Lantai 1 dan Lantai 2) dalam satu model 3D terintegrasi dengan transisi antar lantai yang mulus dan bebas lag.",
          points: [
            "Peralihan lantai instan (Lantai 1, Lantai 2, Semua Lantai)",
            "Kontrol orbit kamera, putar 360°, dan zoom responsif",
            "Visualisasi koridor terminal, apron, dan garbarata pesawat",
          ],
          link: "Eksplorasi Peta",
          href: "/map",
        },
        {
          tag: "SMART ROUTING",
          title: "Perhitungan Rute Belokan Demi Belokan",
          desc: "Mesin pencarian rute cerdas yang menghitung lintasan pejalan kaki tercepat dan paling efisien berbasis lorong resmi terminal.",
          points: [
            "Deteksi rute tercepat antarlantai via eskalator dan tangga",
            "Mendukung jalur eskalator terarah (khusus naik atau turun)",
            "Estimasi jarak tempuh meter riil dan waktu berjalan (ETA)",
          ],
          link: "Coba Navigasi",
          href: "/map",
        },
        {
          tag: "OMNI-SEARCH",
          title: "Pencarian Tenant & Fasilitas Seketika",
          desc: "Temukan lokasi boarding gate 1–12, konter check-in maskapai, restoran, kafe, musholla, toilet, dan ATM secara cepat dengan autocomplete.",
          points: [
            "Pencarian cepat berdasarkan nama lokasi atau kategori",
            "Kategori filter: Toilet, Musholla, Gate, Departure, ATM, Kuliner",
            "Pilihan rute langsung ke titik tujuan dalam satu sentuhan",
          ],
          link: "Cari Fasilitas",
          href: "/map",
        },
        {
          tag: "UNIVERSAL ACCESS",
          title: "Responsif di Smartphone & Kiosk",
          desc: "Antarmuka modern yang dapat diakses langsung melalui browser ponsel penumpang, tablet petugas, maupun layar sentuh kiosk terminal.",
          points: [
            "Ringan dan cepat diakses melalui pemindaian QR code",
            "Antarmuka sentuh yang intuitif dan ramah pengguna",
            "Dukungan multibahasa lengkap (Bahasa Indonesia & English)",
          ],
          link: "Lihat Panduan",
          href: "/help",
        },
      ],
    },
    airportFacts: {
      eyebrow: "PROFIL OPERASIONAL TERMINAL 1",
      title: "Mengenal Gerbang Udara Utama Jawa Timur",
      desc: "Terminal 1 Bandara Internasional Juanda Surabaya (SUB) merupakan pusat mobilitas penerbangan domestik terpadu di bawah naungan PT Angkasa Pura Indonesia (InJourney Airports).",
      cards: [
        {
          num: "01",
          icon: PlaneTakeoff,
          title: "Konektivitas Domestik Terluas",
          desc: "Melayani puluhan ribu penumpang domestik setiap hari, menghubungkan Surabaya dengan lebih dari 30 kota di seluruh Nusantara dari Sabang hingga Merauke.",
        },
        {
          num: "02",
          icon: Building2,
          title: "Infrastruktur 2 Lantai Terpadu",
          desc: "Lantai 1 difungsikan untuk area keberangkatan Departure 1–4, konter check-in 1–83, dan kedatangan. Lantai 2 difungsikan untuk ruang tunggu Boarding Gate 1–12.",
        },
        {
          num: "03",
          icon: ShieldCheck,
          title: "Standar Layanan InJourney",
          desc: "Mengedepankan prinsip 3S+1C (Safety, Security, Services & Compliance) demi kenyamanan, kebersihan, dan keselamatan penerbangan berstandar internasional.",
        },
        {
          num: "04",
          icon: HeartHandshake,
          title: "83+ Mitra Fasilitas & Tenant",
          desc: "Menghadirkan ragam pilihan kuliner legendaris khas Jawa Timur, gerai internasional, ritel cinderamata, perbankan, ruang laktasi, dan fasilitas disabilitas ramah keluarga.",
        },
      ],
    },
    closing: {
      eyebrow: "MULAI SEKARANG",
      title: "Siap Menjelajahi Terminal 1 Bandara Juanda?",
      desc: "Buka peta navigasi 3D interaktif sekarang atau pelajari panduan penggunaan alur perjalanan untuk pengalaman terbang yang tenang dan menyenangkan.",
      buttonMap: "Buka Peta 3D Sekarang",
      buttonGuide: "Buka Panduan Penumpang",
    },
  },
  EN: {
    heroEyebrow: "ABOUT TODJUANDA · INJOURNEY AIRPORTS",
    heroTitlePrefix: "Digital Twin Navigation Innovation at ",
    heroTitleAccent: "Juanda International Airport",
    heroDesc:
      "ToDjuanda is the first interactive 3D indoor wayfinding platform engineered specifically for Terminal 1 passengers at Juanda International Airport Surabaya (SUB). Seamlessly connecting your position to departure gates, airline desks, and vital facilities with high precision and zero stress.",
    openMap: "Open 3D Map",
    openGuide: "User Guide",
    stats: {
      floors: "2 Integrated Floors",
      floorsSub: "Ground Floor & Level 2",
      web: "100% Web-Based",
      webSub: "No App Install Required",
      speed: "72 m/min",
      speedSub: "Walking Pace ETA",
      gates: "Gates 1 – 12",
      gatesSub: "Boarding Gates",
    },
    showcase: {
      brand: "Juanda Airport Map",
      status: "2D Satellite Map",
      caption: "Click Terminal 1 to enter interactive 3D map",
      pills: [
        { label: "Entrance & Check-in", icon: "building" },
        { label: "Boarding Gates 1-12", icon: "plane" },
        { label: "Escalator & Stair Connectors", icon: "layers" },
        { label: "F&B & Amenities Directory", icon: "search" },
      ],
    },
    visionSection: {
      eyebrow: "BACKGROUND & VISION",
      title: "Delivering a Calm and Stress-Free Airport Journey",
      lead:
        "Juanda International Airport (SUB), operated by PT Angkasa Pura Indonesia (InJourney Airports), welcomes tens of thousands of travelers daily at Terminal 1. Within a terminal spanning tens of thousands of square meters, clear orientation and time efficiency are paramount to traveler peace of mind.",
      cardKicker: "OUR MISSION & COMMITMENT",
      cardTitle: "Fast, Accurate, and Passenger-Centric Wayfinding",
      cardDesc:
        "Travelers often face airport anxiety when looking for boarding gates, navigating escalators to level 2, or searching for essential amenities like prayer rooms and restrooms. ToDjuanda delivers real 3D spatial models and automated turn-by-turn guidance so every traveler can walk with confidence from drop-off to boarding.",
      cardStats: [
        { value: "0 sec", label: "No app download required" },
        { value: "100%", label: "Coverage of T1 public spaces" },
        { value: "Multi-Floor", label: "Connected Levels 1 & 2 routing" },
      ],
      benefits: [
        {
          badge: "Real 3D Spatial",
          title: "Intuitive Orientation",
          desc: "Realistic 3D models help travelers understand terminal structure, level layouts, and corridors exactly as they exist in reality.",
        },
        {
          badge: "Verified Routes",
          title: "Official Walkable Paths",
          desc: "Routing strictly follows verified pedestrian corridors, stairs, and escalators without unrealistic paths passing through walls.",
        },
        {
          badge: "Punctual Travel",
          title: "Confidence Before Flight",
          desc: "View exact distance in meters and walking minutes to your assigned departure gate so you never risk missing your flight.",
        },
      ],
    },
    featuresSection: {
      eyebrow: "CORE FEATURES",
      title: "Intelligently Designed for Every Traveler's Needs",
      desc: "Every capability in ToDjuanda is built with a focus on seamless interaction, instant accessibility, and verified terminal data accuracy.",
      items: [
        {
          tag: "DIGITAL TWIN 3D",
          title: "Integrated Multi-Floor 3D Plan",
          desc: "Comprehensive representation of Juanda Terminal 1 (Ground Floor & Level 2) within an integrated 3D model featuring smooth floor transitions.",
          points: [
            "Instant floor switcher (Level 1, Level 2, All Floors)",
            "360° camera orbit, smooth panning, and pinch zoom controls",
            "Visualization of corridors, gate lounges, and aeroramps",
          ],
          link: "Explore Map",
          href: "/map",
        },
        {
          tag: "SMART ROUTING",
          title: "Turn-by-Turn Pathfinding Engine",
          desc: "Smart pedestrian engine calculating the fastest and most optimal path connecting your current position directly to your aircraft gate.",
          points: [
            "Fastest route detection across levels via escalators and stairs",
            "Directional escalator awareness (upward vs downward paths)",
            "Realistic walking meter distance and estimated minutes (ETA)",
          ],
          link: "Try Navigation",
          href: "/map",
        },
        {
          tag: "OMNI-SEARCH",
          title: "Instant Facility & Tenant Search",
          desc: "Locate Boarding Gates 1–12, airline check-in desks, restaurants, cafes, prayer rooms, restrooms, and ATMs instantly with autocomplete.",
          points: [
            "Quick lookup by location name, airline, or facility category",
            "Convenient category filters: Restrooms, Prayer Rooms, Gates, ATMs",
            "Single-tap route plotting to any selected destination",
          ],
          link: "Search Facilities",
          href: "/map",
        },
        {
          tag: "UNIVERSAL ACCESS",
          title: "Responsive on Smartphones & Kiosks",
          desc: "Flexible, modern web interface accessible on passenger smartphones, staff tablets, or airport interactive touchscreen kiosks.",
          points: [
            "Instant loading via QR code scan without app store downloads",
            "Intuitive, passenger-tested touch interaction design",
            "Bilingual interface support (Bahasa Indonesia & English)",
          ],
          link: "View Guide",
          href: "/help",
        },
      ],
    },
    airportFacts: {
      eyebrow: "TERMINAL 1 OPERATIONAL PROFILE",
      title: "Discovering East Java's Primary Aviation Hub",
      desc: "Juanda International Airport Terminal 1 (SUB) is the central domestic aviation gateway operated by PT Angkasa Pura Indonesia (InJourney Airports).",
      cards: [
        {
          num: "01",
          icon: PlaneTakeoff,
          title: "Extensive Domestic Connectivity",
          desc: "Serving tens of thousands of travelers daily, linking Surabaya directly to over 30 destinations across the Indonesian archipelago.",
        },
        {
          num: "02",
          icon: Building2,
          title: "Integrated 2-Floor Infrastructure",
          desc: "Level 1 serves Departures 1–4, check-in desks 1–83, and Arrivals. Level 2 hosts Boarding Gates 1–12 and passenger departure lounges.",
        },
        {
          num: "03",
          icon: ShieldCheck,
          title: "InJourney Airport Standards",
          desc: "Upholding 3S+1C standards (Safety, Security, Services & Compliance) to deliver international-caliber cleanliness, comfort, and security.",
        },
        {
          num: "04",
          icon: HeartHandshake,
          title: "83+ Amenities & Tenant Partners",
          desc: "Featuring renowned East Javanese local culinary heritage, global dining, retail boutiques, banking hubs, nursing rooms, and accessible family facilities.",
        },
      ],
    },
    closing: {
      eyebrow: "GET STARTED",
      title: "Ready to Explore Juanda Airport Terminal 1?",
      desc: "Open the interactive 3D navigation map now or consult our passenger travel guide for a calm and enjoyable flying experience.",
      buttonMap: "Open 3D Map Now",
      buttonGuide: "Open Passenger Guide",
    },
  },
} as const;

export function AboutPage() {
  const pageRef = useRef<HTMLElement>(null);
  const lang = useMapStore((state) => state.lang);
  const content = aboutContent[lang];

  useEffect(() => {
    const container = pageRef.current;
    if (!container) return;

    const revealElements = container.querySelectorAll<HTMLElement>(`.${styles.revealOnScroll}`);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.isRevealed);
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
  }, [lang]);

  return (
    <div className={styles.page}>
      <SiteHeader />

      <main className={styles.main} ref={pageRef}>
        {/* =========================================
            HERO SECTION
            ========================================= */}
        <section className={styles.hero} aria-labelledby="about-hero-title">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroGlowLeft} aria-hidden="true" />

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
                  <Compass size={18} />
                  <span>{content.openMap}</span>
                  <ArrowRight size={16} />
                </Link>
                <Link href="/help" className={styles.ghostButton}>
                  <Sparkles size={16} />
                  <span>{content.openGuide}</span>
                </Link>
              </div>

              {/* Metrics Strip */}
              <div className={styles.heroMetrics}>
                <div className={styles.metricItem}>
                  <span className={styles.metricValue}>{content.stats.floors}</span>
                  <span className={styles.metricLabel}>{content.stats.floorsSub}</span>
                </div>
                <div className={styles.metricDivider} aria-hidden="true" />
                <div className={styles.metricItem}>
                  <span className={styles.metricValue}>{content.stats.web}</span>
                  <span className={styles.metricLabel}>{content.stats.webSub}</span>
                </div>
                <div className={styles.metricDivider} aria-hidden="true" />
                <div className={styles.metricItem}>
                  <span className={styles.metricValue}>{content.stats.speed}</span>
                  <span className={styles.metricLabel}>{content.stats.speedSub}</span>
                </div>
                <div className={styles.metricDivider} aria-hidden="true" />
                <div className={styles.metricItem}>
                  <span className={styles.metricValue}>{content.stats.gates}</span>
                  <span className={styles.metricLabel}>{content.stats.gatesSub}</span>
                </div>
              </div>
            </div>

            {/* Showcase Visual Card (2D Overview Map ala Google Maps) */}
            <div className={`${styles.heroShowcase} ${styles.revealOnScroll} ${styles.revealDelay1}`}>
              <div className={styles.showcaseCard}>
                <div className={styles.showcaseHeader}>
                  <div className={styles.showcaseBrand}>
                    <PlaneTakeoff size={16} />
                    <span>{content.showcase.brand}</span>
                  </div>
                  <span className={styles.showcaseBadge}>{content.showcase.status}</span>
                </div>

                {/* Juanda Overview Map using Google Maps Tile API */}
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
            VISION & BACKGROUND SECTION
            ========================================= */}
        <section className={styles.visionSection} aria-label="Latar Belakang & Visi">
          <div className={styles.container}>
            <div className={`${styles.visionHeader} ${styles.revealOnScroll}`}>
              <div className={styles.visionEyebrow}>
                <Sparkles size={14} />
                <span>{content.visionSection.eyebrow}</span>
              </div>
              <h2 className={styles.visionTitle}>{content.visionSection.title}</h2>
              <p className={styles.visionLead}>{content.visionSection.lead}</p>
            </div>

            <div className={styles.visionGrid}>
              {/* Left Column: Mission & Impact Card */}
              <div className={`${styles.visionMissionCard} ${styles.revealOnScroll} ${styles.revealDelay1}`}>
                <div>
                  <div className={styles.visionMissionKicker}>{content.visionSection.cardKicker}</div>
                  <h3 className={styles.visionMissionTitle}>{content.visionSection.cardTitle}</h3>
                  <p className={styles.visionMissionDesc}>{content.visionSection.cardDesc}</p>
                </div>

                <div className={styles.visionStatsRow}>
                  {content.visionSection.cardStats.map((stat, sIdx) => (
                    <div key={sIdx} className={styles.visionStatBox}>
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: 3 Value Pillars */}
              <div className={`${styles.visionPillarsCol} ${styles.revealOnScroll} ${styles.revealDelay2}`}>
                {content.visionSection.benefits.map((b, idx) => {
                  const icons = [
                    <Compass key={0} size={22} />,
                    <Route key={1} size={22} />,
                    <PlaneTakeoff key={2} size={22} />,
                  ];
                  return (
                    <div key={idx} className={styles.visionPillarCard}>
                      <span className={styles.pillarIconWrap}>{icons[idx % icons.length]}</span>
                      <div className={styles.pillarBody}>
                        <div className={styles.pillarHeader}>
                          <strong>{b.title}</strong>
                          <span className={styles.pillarBadge}>{b.badge}</span>
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
            CORE FEATURES SECTION
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

            <div className={styles.featuresGrid}>
              {content.featuresSection.items.map((item, idx) => {
                const icons = [
                  <Layers key={0} size={24} />,
                  <Route key={1} size={24} />,
                  <Search key={2} size={24} />,
                  <Smartphone key={3} size={24} />,
                ];
                const delayClass = [
                  styles.revealDelay1,
                  styles.revealDelay2,
                  styles.revealDelay3,
                  styles.revealDelay4,
                ][idx % 4];

                return (
                  <article key={idx} className={`${styles.featureCard} ${styles.revealOnScroll} ${delayClass}`}>
                    <div className={styles.featureIconWrap}>{icons[idx % icons.length]}</div>
                    <span className={styles.featureTag}>{item.tag}</span>
                    <h3 className={styles.featureTitle}>{item.title}</h3>
                    <p className={styles.featureDesc}>{item.desc}</p>

                    <ul className={styles.featureBulletList}>
                      {item.points.map((pt, pIdx) => (
                        <li key={pIdx} className={styles.featureBulletItem}>
                          <CheckCircle2 size={14} />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>

                    <div className={styles.featureCardFooter}>
                      <Link href={item.href} className={styles.featureLink}>
                        <span>{item.link}</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================
            AIRPORT OPERATIONAL PROFILE SECTION
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
                  <div key={idx} className={`${styles.airportCard} ${styles.revealOnScroll}`}>
                    <div className={styles.airportCardTop}>
                      <span className={styles.airportCardNum}>{card.num}</span>
                      <div className={styles.airportCardIconWrap}>
                        <Icon size={20} />
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
