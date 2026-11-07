"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import styles from "./HomeHero.module.css";

export function HomeHero() {
  const lang = useMapStore((state) => state.lang);
  const isID = lang === "ID";
  const [facilityCount, setFacilityCount] = useState<number>(83);

  useEffect(() => {
    let active = true;
    fetch("/api/tenants", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.tenants) && data.tenants.length > 0) {
          setFacilityCount(data.tenants.length);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const board = [
    {
      label: isID ? "Terminal" : "Terminal",
      value: "Terminal 1",
      desc: isID ? "Penerbangan Domestik" : "Domestic Flights",
    },
    {
      label: isID ? "Lantai Operasional" : "Operating Floors",
      value: "Lantai 1 & 2",
      desc: isID ? "Kedatangan & Keberangkatan" : "Arrivals & Departures",
    },
    {
      label: isID ? "Pintu Keberangkatan" : "Boarding Gates",
      value: "Gate 1 – 12",
      desc: isID ? "Lantai 2 Terminal 1" : "2nd Floor Terminal 1",
    },
    {
      label: isID ? "Fasilitas & Tenant" : "Facilities & Tenants",
      value: `${facilityCount}+ Lokasi`,
      desc: isID ? "Terdaftar di Direktori" : "Registered in Directory",
    },
  ];

  return (
    <>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.inner}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>JUANDA INTERNATIONAL AIRPORT · SURABAYA</p>
            <h1 id="home-title" className={styles.title}>
              {isID ? "Temukan Jalur Anda di Terminal 1" : "Find Your Way Through Terminal 1"}
            </h1>
            <p className={styles.subtitle}>
              {isID
                ? "Navigasi interaktif multi-lantai dengan panduan arah rute presisi menuju boarding gate, counter check-in, dan fasilitas bandara."
                : "Interactive multi-floor navigation with precise walking route guidance to boarding gates, check-in counters, and airport facilities."}
            </p>
            <div className={styles.actions}>
              <Link href="/map" className={styles.primaryCta}>
                <Compass size={20} aria-hidden="true" />
                <span>{isID ? "Buka Peta Navigasi" : "Open Navigation Map"}</span>
                <ArrowRight size={20} aria-hidden="true" />
              </Link>
              <Link href="/about" className={styles.secondaryCta}>
                <span>{isID ? "Tentang Bandara" : "About Airport"}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Airport Stats Section - Posisi di bawah lipatan awal halaman */}
      <section
        className={styles.statsSection}
        aria-label={isID ? "Informasi Operasional Bandara" : "Airport Operational Information"}
      >
        <div className={styles.statsInner}>
          <dl className={styles.statsGrid}>
            {board.map((cell) => (
              <div key={cell.label} className={styles.statCard}>
                <dt className={styles.statLabel}>{cell.label}</dt>
                <dd className={styles.statValue}>{cell.value}</dd>
                <p className={styles.statDesc}>{cell.desc}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
