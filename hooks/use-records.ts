"use client";
import { useCallback, useEffect, useState } from "react";
import { listRecords, getProfile } from "@/lib/firestore/client";
import type { RecordData, Profile } from "@/types";
export function useRecords(collection: string, doctorId?: string) {
  const [records, setRecords] = useState<RecordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      setError("");
      const result = await listRecords(collection, undefined, doctorId);
      setRecords(result.records);
      setCursor(result.nextCursor);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load your information.",
      );
    } finally {
      setLoading(false);
    }
  }, [collection, doctorId]);
  useEffect(() => {
    setLoading(true);
    void refresh();
    const listener = () => {
      void refresh();
    };
    window.addEventListener("uyirnadi-data", listener);
    return () => window.removeEventListener("uyirnadi-data", listener);
  }, [refresh]);
  const loadMore = async () => {
    if (!cursor) return;
    setLoading(true);
    try {
      const data = await listRecords(collection, cursor, doctorId);
      setRecords((old) => [...old, ...data.records]);
      setCursor(data.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load more.");
    } finally {
      setLoading(false);
    }
  };
  return { records, loading, error, refresh, loadMore, hasMore: !!cursor };
}
export function useProfile() {
  const [profile, setProfile] = useState<Profile>({ name: "there", email: "" });
  useEffect(() => {
    const load = () =>
      getProfile()
        .then(setProfile)
        .catch(() => {});
    void load();
    window.addEventListener("uyirnadi-data", load);
    return () => window.removeEventListener("uyirnadi-data", load);
  }, []);
  return profile;
}
