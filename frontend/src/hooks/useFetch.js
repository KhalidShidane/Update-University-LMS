import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";

/**
 * Simple GET data-fetching hook with loading / error / refetch.
 * `url` may be null to skip fetching.
 */
export default function useFetch(url, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState("");

  const run = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, refetch: run, setData };
}
