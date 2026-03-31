'use client';

import { useCallback, useEffect, useState } from 'react';
import { FarmDetails } from '../types/chat';

export interface UseFarmDetailsReturn {
  /** Current farm details (null while loading). */
  farmDetails: FarmDetails | null;
  /** True while the initial fetch is in progress. */
  loading: boolean;
  /** True while an update (PUT) is in progress. */
  saving: boolean;
  /** Error message, if the last operation failed. */
  error: string | null;
  /** Persist updated farm details to the backend. */
  updateFarmDetails: (data: Partial<FarmDetails>) => Promise<FarmDetails>;
  /** Re-fetch farm details from the backend. */
  refetch: () => Promise<void>;
}

export function useFarmDetails(): UseFarmDetailsReturn {
  const [farmDetails, setFarmDetails] = useState<FarmDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await fetch('/api/farm-details');
      if (res.ok) {
        const data: FarmDetails = await res.json();
        setFarmDetails(data);
        setError(null);
      } else {
        setError('Failed to fetch farm details');
      }
    } catch {
      setError('Failed to fetch farm details');
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/farm-details');
        if (res.ok && !cancelled) {
          const data: FarmDetails = await res.json();
          setFarmDetails(data);
        }
      } catch {
        // Backend may not be reachable yet — not fatal
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateFarmDetails = useCallback(
    async (data: Partial<FarmDetails>): Promise<FarmDetails> => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch('/api/farm-details', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const updated: FarmDetails = await res.json();
        setFarmDetails(updated);
        return updated;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Failed to update farm details';
        setError(msg);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchDetails();
    setLoading(false);
  }, [fetchDetails]);

  return {
    farmDetails,
    loading,
    saving,
    error,
    updateFarmDetails,
    refetch,
  };
}
