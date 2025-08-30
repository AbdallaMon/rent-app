"use client";

const { useState, useEffect } = require("react");

export function useFastList(type, mapFn) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/fast-handler?id=${encodeURIComponent(type)}`
        );
        const data = await res.json();
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setItems(mapFn ? list.map(mapFn) : list);
      } catch (e) {
        if (active) setError(e?.message || `Failed to load ${type}`);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [type, mapFn]);
  return { loading, items, error };
}
