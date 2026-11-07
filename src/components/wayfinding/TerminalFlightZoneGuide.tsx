"use client";

import Link from "next/link";
import { ArrowRight, Plane } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import styles from "./TerminalFlightZoneGuide.module.css";

export function TerminalFlightZoneGuide() {
  const lang = useMapStore((state) => state.lang);
  const isID = lang === "ID";

  const zones = [
    {
      badge: isID ? "Pintu Barat · Lantai 1" : "West Gate · Level 1",
      title: isID ? "Departure 1 & 2" : "Departure 1 & 2",
      tag: isID ? "Check-in Domestik" : "Domestic Check-in",
      airlines: "Lion Air · Wings Air · Super Air Jet",
      features: isID
        ? "Konter Check-in 1–40, Cetak Boarding Pass Mandiri, Drop Bagasi"
        : "Check-in Desks 1–40, Self-Service Kiosks, Baggage Drop",
      link: "/map?q=departure",
      cta: isID ? "Lihat Area di Peta" : "View Area on Map",
    },
    {
      badge: isID ? "Pintu Timur · Lantai 1" : "East Gate · Level 1",
      title: isID ? "Departure 3 & 4" : "Departure 3 & 4",
      tag: isID ? "Check-in Domestik" : "Domestic Check-in",
      airlines: "Citilink · Garuda Indonesia · Batik Air · Sriwijaya Air",
      features: isID
        ? "Konter Check-in 41–83, Layanan Pelanggan Maskapai, ATM & Resto"
        : "Check-in Desks 41–83, Airline Customer Service, ATMs & Dining",
      link: "/map?q=departure",
      cta: isID ? "Lihat Area di Peta" : "View Area on Map",
    },
    {
      badge: isID ? "Ruang Tunggu · Lantai 2" : "Waiting Lounge · Level 2",
      title: isID ? "Boarding Gate 1 – 12" : "Boarding Gate 1 – 12",
      tag: isID ? "Area Masuk Pesawat" : "Aircraft Boarding",
      airlines: isID ? "Seluruh Penerbangan Domestik T1" : "All T1 Domestic Flights",
      features: isID
        ? "Pemeriksaan Keamanan 2 (SCP 2), Garbarata, Musholla, Toilet & Kafe"
        : "Security Checkpoint 2, Aerobridges, Prayer Rooms & Cafes",
      link: "/map?q=gate",
      cta: isID ? "Cari Gate di Peta" : "Find Gates on Map",
    },
  ];

  return (
    <section className={styles.section} aria-labelledby="flight-zone-title">
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>
            <Plane size={15} aria-hidden="true" />
            <span>{isID ? "PANDUAN PENUMPANG TERMINAL 1" : "TERMINAL 1 PASSENGER GUIDE"}</span>
          </span>
          <h2 id="flight-zone-title" className={styles.title}>
            {isID ? (
              <>Penerbangan Anda di <span>Area Mana?</span></>
            ) : (
              <>Where is Your <span>Flight Area?</span></>
            )}
          </h2>
          <p className={styles.subtitle}>
            {isID
              ? "Ketahui pintu keberangkatan dan area check-in sesuai maskapai penerbangan Anda sebelum melangkah masuk terminal."
              : "Locate your assigned departure entrance and check-in zone according to your airline before entering the terminal."}
          </p>
        </div>

        <div className={styles.grid}>
          {zones.map((zone, idx) => (
            <div key={idx} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.badge}>{zone.badge}</span>
                <span className={styles.tag}>{zone.tag}</span>
              </div>
              <h3 className={styles.cardTitle}>{zone.title}</h3>
              <div className={styles.airlineRow}>
                <span className={styles.airlineLabel}>{isID ? "Maskapai:" : "Airlines:"}</span>
                <strong className={styles.airlineText}>{zone.airlines}</strong>
              </div>
              <p className={styles.featuresText}>{zone.features}</p>
              <Link href={zone.link} className={styles.cardAction}>
                <span>{zone.cta}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
