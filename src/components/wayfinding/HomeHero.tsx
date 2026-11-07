"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, Plane, Luggage, Bath, Moon, Landmark, ShoppingBag } from "lucide-react";
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

  // Repeat board items to guarantee seamless infinite scrolling on all screen resolutions
  const repeatedBoard = [...board, ...board];

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

            {/* Quick Access Facilities Pills */}
            <div className={styles.shortcutsWrap}>
              <span className={styles.shortcutsLabel}>
                {isID ? "Akses Cepat Fasilitas:" : "Quick Access:"}
              </span>
              <div className={styles.shortcutsList}>
                <Link href="/map?q=gate" className={styles.shortcutPill}>
                  <Plane size={15} aria-hidden="true" />
                  <span>Gate 1 – 12</span>
                </Link>
                <Link href="/map?q=check-in" className={styles.shortcutPill}>
                  <Luggage size={15} aria-hidden="true" />
                  <span>Check-in</span>
                </Link>
                <Link href="/map?q=toilet" className={styles.shortcutPill}>
                  <Bath size={15} aria-hidden="true" />
                  <span>Toilet</span>
                </Link>
                <Link href="/map?q=musholla" className={styles.shortcutPill}>
                  <Moon size={15} aria-hidden="true" />
                  <span>Musholla</span>
                </Link>
                <Link href="/map?q=atm" className={styles.shortcutPill}>
                  <Landmark size={15} aria-hidden="true" />
                  <span>ATM</span>
                </Link>
                <Link href="/map?q=komersial" className={styles.shortcutPill}>
                  <ShoppingBag size={15} aria-hidden="true" />
                  <span>Kuliner & Ritel</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Airport Stats Section - Slim continuous horizontal marquee ticker */}
      <section
        className={styles.statsSection}
        aria-label={isID ? "Informasi Operasional Bandara" : "Airport Operational Information"}
      >
        <div className={styles.tickerTrack}>
          {/* Primary loop group */}
          <div className={styles.tickerGroup}>
            {repeatedBoard.map((cell, idx) => (
              <div key={`${cell.label}-${idx}`} className={styles.statCard}>
                <span className={styles.statDot} aria-hidden="true" />
                <span className={styles.statLabel}>{cell.label}:</span>
                <strong className={styles.statValue}>{cell.value}</strong>
                <span className={styles.statDesc}>{cell.desc}</span>
                <span className={styles.statDivider} aria-hidden="true" />
              </div>
            ))}
          </div>

          {/* Duplicate loop group for seamless continuous loop */}
          <div className={styles.tickerGroup} aria-hidden="true">
            {repeatedBoard.map((cell, idx) => (
              <div key={`dup-${cell.label}-${idx}`} className={styles.statCard}>
                <span className={styles.statDot} aria-hidden="true" />
                <span className={styles.statLabel}>{cell.label}:</span>
                <strong className={styles.statValue}>{cell.value}</strong>
                <span className={styles.statDesc}>{cell.desc}</span>
                <span className={styles.statDivider} aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
