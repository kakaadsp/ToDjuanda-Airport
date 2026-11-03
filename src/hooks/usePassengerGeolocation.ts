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
  const samplesRef = useRef<PassengerLocationReading[]>([]);

  const refresh = useCallback(() => {
    samplesRef.current = [];
    setReading(null);
    setStatus("checking");
    setAttempt((value) => value + 1);
  }, []);

  const retry = refresh;

  useEffect(() => {
    if (!enabled) {
      samplesRef.current = [];
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
        if (!Number.isFinite(next.latitude) || !Number.isFinite(next.longitude) || next.accuracy > 65) return;
        const previous = samplesRef.current.at(-1);
        if (previous) {
          const dLat = (next.latitude - previous.latitude) * 111_320;
          const dLon = (next.longitude - previous.longitude) * 111_320 * Math.cos(next.latitude * Math.PI / 180);
          const jumpMeters = Math.hypot(dLat, dLon);
          const elapsedSeconds = Math.max(0.5, (next.timestamp - previous.timestamp) / 1000);
          if (jumpMeters > Math.max(25, next.accuracy * 1.2) && jumpMeters / elapsedSeconds > 6) return;
        }
        samplesRef.current = [...samplesRef.current.slice(-5), next];
        const samples = samplesRef.current;
        // Akurasi 1.0: Kumpulkan minimal 4 sampel akurat sebelum mengunci titik awal
        // agar koordinat konvergen stabil dan tidak terlempar oleh sinyal kasar pertama.

        const MIN_REQUIRED_SAMPLES = 4;
        if (samples.length < MIN_REQUIRED_SAMPLES) {
          setStatus("checking");




          return;
        }
        let totalWeight = 0;
        let weightedLat = 0;
        let weightedLon = 0;
        let bestAccuracy = Infinity;

        for (const sample of samples) {
          const weight = 1 / Math.max(sample.accuracy * sample.accuracy, 1);
          totalWeight += weight;
          weightedLat += sample.latitude * weight;
          weightedLon += sample.longitude * weight;
          if (sample.accuracy < bestAccuracy) bestAccuracy = sample.accuracy;
        }

        const latitude = weightedLat / totalWeight;
        const longitude = weightedLon / totalWeight;

        setReading({ ...next, latitude, longitude, accuracy: Math.max(8, bestAccuracy) });
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
