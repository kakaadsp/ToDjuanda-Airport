"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PassengerLocationStatus =
  | "checking"
  | "tracking"
  | "denied"
  | "unavailable"
  | "timeout"
  | "disabled";

export type PassengerLocationReading = {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  timestamp: number;
};

export function usePassengerGeolocation(enabled = true) {
  const [status, setStatus] = useState<PassengerLocationStatus>(enabled ? "checking" : "disabled");
  const [reading, setReading] = useState<PassengerLocationReading | null>(null);
  const [attempt, setAttempt] = useState(0);
  const previousRawRef = useRef<PassengerLocationReading | null>(null);
  const filteredRef = useRef<PassengerLocationReading | null>(null);

  const refresh = useCallback(() => {
    previousRawRef.current = null;
    filteredRef.current = null;
    setReading(null);
    setStatus("checking");
    setAttempt((value) => value + 1);
  }, []);

  const retry = refresh;

  useEffect(() => {
    if (!enabled) {
      previousRawRef.current = null;
      filteredRef.current = null;
      const frame = window.requestAnimationFrame(() => {
        setReading(null);
        setStatus("disabled");
      });
      return () => window.cancelAnimationFrame(frame);
    }
    if (!window.isSecureContext || !("geolocation" in navigator)) {
      const frame = window.requestAnimationFrame(() => setStatus("unavailable"));
      return () => window.cancelAnimationFrame(frame);
    }

    const acceptPosition = (position: GeolocationPosition) => {
        const next: PassengerLocationReading = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          timestamp: position.timestamp,
        };
        // GPS indoor sering mengirim loncatan besar. Abaikan pembacaan yang
        // terlalu kasar atau tidak masuk akal dibanding sampel sebelumnya.
        if (!Number.isFinite(next.latitude) || !Number.isFinite(next.longitude) || next.accuracy > 100) return;
        const previous = previousRawRef.current;
        if (previous) {
          const dLat = (next.latitude - previous.latitude) * 111_320;
          const dLon = (next.longitude - previous.longitude) * 111_320 * Math.cos(next.latitude * Math.PI / 180);
          const jumpMeters = Math.hypot(dLat, dLon);
          const elapsedSeconds = Math.max(0.5, (next.timestamp - previous.timestamp) / 1000);
          // Abaikan loncatan yang tidak mungkin dilakukan manusia. Ambang
          // mengikuti kedua tingkat akurasi agar GPS yang sedang membaik tidak
          // tertahan oleh filter yang terlalu ketat.
          const jumpLimit = Math.max(35, previous.accuracy + next.accuracy);
          if (jumpMeters > jumpLimit && jumpMeters / elapsedSeconds > 10) return;
        }
        previousRawRef.current = next;

        const previousFiltered = filteredRef.current;
        // Pembacaan pertama langsung dipakai agar titik awal cepat muncul.
        // Setelah itu gunakan exponential smoothing adaptif: GPS yang lebih
        // akurat dan pembacaan yang lebih baru mendapat bobot lebih besar,
        // sehingga marker tetap stabil tanpa tertinggal beberapa sampel.
        const elapsedSeconds = previousFiltered
          ? Math.max(0.25, (next.timestamp - previousFiltered.timestamp) / 1000)
          : 0;
        const accuracyWeight = Math.min(0.94, Math.max(0.58, 1 - next.accuracy / 180));
        const timeWeight = previousFiltered && elapsedSeconds > 3 ? 0.9 : accuracyWeight;
        const latitude = previousFiltered
          ? previousFiltered.latitude + (next.latitude - previousFiltered.latitude) * timeWeight
          : next.latitude;
        const longitude = previousFiltered
          ? previousFiltered.longitude + (next.longitude - previousFiltered.longitude) * timeWeight
          : next.longitude;
        const filtered = { ...next, latitude, longitude };
        filteredRef.current = filtered;
        setReading(filtered);
        setStatus("tracking");
      };
    const handleError = (error: GeolocationPositionError) => {
        if (error.code === error.PERMISSION_DENIED) setStatus("denied");
        else if (error.code === error.TIMEOUT) setStatus("timeout");
        else setStatus("unavailable");
      };
    const watchId = navigator.geolocation.watchPosition(
      acceptPosition,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20_000,
      },
    );
    navigator.geolocation.getCurrentPosition(acceptPosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20_000,
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [attempt, enabled]);

  return { status, reading, retry, refresh };
}
