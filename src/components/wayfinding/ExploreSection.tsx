"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import styles from "./ExploreSection.module.css";

const OverviewMap = dynamic(
  () => import("@/components/map2d/JuandaOverviewMap").then((module) => module.JuandaOverviewMap),
  { ssr: false },
);

export function ExploreSection() {
  const lang = useMapStore((state) => state.lang);
  const id = lang === "ID";
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = sectionRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "250px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      title: id ? "Cari Tujuan Anda" : "Search Destination",
      text: id ? "Ketik nama gate, konter check-in, musholla, toilet, atau toko." : "Search boarding gates, check-in desks, prayer rooms, or shops.",
    },
    {
      title: id ? "Tentukan Titik Berangkat" : "Set Your Starting Point",
      text: id ? "Pilih lokasi posisi Anda saat ini di Lantai 1 atau Lantai 2." : "Choose where you are right now on Level 1 or Level 2.",
    },
    {
      title: id ? "Ikuti Rute Pejalan Kaki" : "Follow Walking Route",
      text: id ? "Lihat petunjuk arah belokan, eskalator, serta estimasi jarak dan menit." : "View turn-by-turn steps, escalators, and accurate walking ETA.",
    },
  ];

  return (
    <section ref={sectionRef} className={styles.section} id="facility-shortcuts" aria-labelledby="explore-title">
      <div className={styles.copy}>
        <span className={styles.eyebrow}>{id ? "Peta Bandara Juanda" : "Juanda Airport map"}</span>
        <h2 id="explore-title" className={styles.title}>{id ? "Mau mulai dari mana?" : "Where would you like to start?"}</h2>
        <p className={styles.lead}>
          {id
            ? "Klik Terminal 1 di peta untuk masuk ke tampilan 3D, lalu tentukan titik awal dan tujuanmu."
            : "Click Terminal 1 on the map to enter the 3D view, then set your start point and destination."}
        </p>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.title}>
              <Link href="/map" className={styles.step}>
                <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.stepBody}>
                  <strong>{step.title}</strong>
                  <span>{step.text}</span>
                </span>
                <ArrowRight size={18} className={styles.arrow} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
        <Link href="/map" className={styles.cta}>
          {id ? "Buka peta 3D" : "Open the 3D map"}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
      <div className={styles.frame} aria-label={id ? "Peta Bandara Juanda" : "Juanda Airport map"}>
        {visible
          ? <OverviewMap />
          : <span className={styles.placeholder} role="status">{id ? "Memuat peta bandara..." : "Loading airport map..."}</span>}
        <span className={styles.caption}>{id ? "Klik area Terminal 1 untuk masuk ke 3D" : "Click Terminal 1 to enter 3D"}</span>
      </div>
    </section>
  );
}
