"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Luggage,
  MapPin,
  Plane,
  Sparkles,
} from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import styles from "./TerminalFlightZoneGuide.module.css";

export function TerminalFlightZoneGuide() {
  const lang = useMapStore((state) => state.lang);
  const isID = lang === "ID";

  const zones = [
    {
      num: "01",
      icon: Luggage,
      themeClass: styles.themeCyan,
      badge: isID ? "Pintu Barat · Lantai 1" : "West Gate · Level 1",
      title: isID ? "Departure 1 & 2" : "Departure 1 & 2",
      tag: isID ? "Check-in Domestik" : "Domestic Check-in",
      airlinesLabel: isID ? "Maskapai:" : "Airlines:",
      airlines: ["Lion Air", "Wings Air", "Super Air Jet"],
      facilities: isID
        ? [
            "Konter Check-in 1 – 40",
            "Mesin Cetak Boarding Pass Mandiri",
            "Area Drop Bagasi & Pelayanan Maskapai",
          ]
        : [
            "Check-in Desks 1 – 40",
            "Self-Service Kiosks",
            "Baggage Drop & Airline Desk",
          ],
      link: "/map?q=departure",
      cta: isID ? "Lihat Area di Peta" : "View Area on Map",
    },
    {
      num: "02",
      icon: Building2,
      themeClass: styles.themeBlue,
      badge: isID ? "Pintu Timur · Lantai 1" : "East Gate · Level 1",
      title: isID ? "Departure 3 & 4" : "Departure 3 & 4",
      tag: isID ? "Check-in Domestik" : "Domestic Check-in",
      airlinesLabel: isID ? "Maskapai:" : "Airlines:",
      airlines: ["Citilink", "Garuda Indonesia", "Batik Air", "Sriwijaya Air"],
      facilities: isID
        ? [
            "Konter Check-in 41 – 83",
            "Customer Service & Tiketing Maskapai",
            "ATM Center & Restoran Cepat Saji",
          ]
        : [
            "Check-in Desks 41 – 83",
            "Airline Customer Support",
            "ATM Center & Dining Area",
          ],
      link: "/map?q=departure",
      cta: isID ? "Lihat Area di Peta" : "View Area on Map",
    },
    {
      num: "03",
      icon: Plane,
      themeClass: styles.themeEmerald,
      badge: isID ? "Ruang Tunggu · Lantai 2" : "Waiting Lounge · Level 2",
      title: isID ? "Boarding Gate 1 – 12" : "Boarding Gate 1 – 12",
      tag: isID ? "Pintu Masuk Pesawat" : "Aircraft Boarding",
      airlinesLabel: isID ? "Pintu Boarding:" : "Boarding Gates:",
      airlines: isID ? ["Gate 1 – 4", "Gate 5 – 8", "Gate 9 – 12"] : ["Gates 1 – 4", "Gates 5 – 8", "Gates 9 – 12"],
      facilities: isID
        ? [
            "Pemeriksaan Keamanan 2 (SCP 2)",
            "Garbarata Menuju Pesawat",
            "Musholla, Toilet & Kafe Santai",
          ]
        : [
            "Security Checkpoint 2 (SCP 2)",
            "Aerobridges to Aircraft",
            "Prayer Room, Restrooms & Cafes",
          ],
      link: "/map?q=gate",
      cta: isID ? "Cari Gate di Peta" : "Find Gates on Map",
    },
  ];

  return (
    <section className={styles.section} aria-labelledby="flight-zone-title">
      <div className={styles.ambientGlow1} aria-hidden="true" />
      <div className={styles.ambientGlow2} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            <Sparkles size={14} className={styles.eyebrowIcon} aria-hidden="true" />
            <span>{isID ? "PANDUAN PENUMPANG TERMINAL 1" : "TERMINAL 1 PASSENGER GUIDE"}</span>
          </div>
          <h2 id="flight-zone-title" className={styles.title}>
            {isID ? (
              <>Penerbangan Anda di <span className={styles.titleGradient}>Area Mana?</span></>
            ) : (
              <>Where is Your <span className={styles.titleGradient}>Flight Area?</span></>
            )}
          </h2>
          <p className={styles.subtitle}>
            {isID
              ? "Ketahui pintu keberangkatan, area check-in, dan gerbang masuk pesawat sesuai maskapai Anda sebelum memasuki terminal."
              : "Locate your assigned departure gate, check-in zone, and boarding area according to your airline before entering the terminal."}
          </p>
        </div>

        <div className={styles.grid}>
          {zones.map((zone, idx) => {
            const Icon = zone.icon;
            return (
              <div key={idx} className={`${styles.card} ${zone.themeClass}`}>
                {/* Background Number Watermark */}
                <span className={styles.watermarkNum} aria-hidden="true">
                  {zone.num}
                </span>

                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.iconBox}>
                    <Icon size={22} />
                  </div>
                  <div className={styles.badgeWrap}>
                    <span className={styles.badge}>{zone.badge}</span>
                    <span className={styles.tag}>{zone.tag}</span>
                  </div>
                </div>

                {/* Card Title */}
                <h3 className={styles.cardTitle}>{zone.title}</h3>

                {/* Airlines / Gates Badges */}
                <div className={styles.airlinesBox}>
                  <span className={styles.boxLabel}>{zone.airlinesLabel}</span>
                  <div className={styles.airlinePills}>
                    {zone.airlines.map((name, i) => (
                      <span key={i} className={styles.airlinePill}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Facilities Checklist */}
                <div className={styles.facilitiesBox}>
                  <span className={styles.boxLabel}>
                    {isID ? "Fasilitas Tersedia:" : "Available Facilities:"}
                  </span>
                  <ul className={styles.facilityList}>
                    {zone.facilities.map((fac, i) => (
                      <li key={i} className={styles.facilityItem}>
                        <CheckCircle2 size={15} className={styles.checkIcon} aria-hidden="true" />
                        <span>{fac}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action CTA */}
                <Link href={zone.link} className={styles.cardAction}>
                  <span>{zone.cta}</span>
                  <ArrowRight size={16} className={styles.actionArrow} aria-hidden="true" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
