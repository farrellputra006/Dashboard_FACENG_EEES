import React, { useState, useEffect } from 'react';
import { subscribeToLoading } from '../utils/api';

/**
 * Corporate Blue Indeterminate Top Progress Bar
 * Non-invasive global progress bar that automatically illuminates across
 * the top of the viewport whenever any background/foreground API request is running.
 */
export default function GlobalTopLoader() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return subscribeToLoading((isLoading) => {
      setLoading(isLoading);
    });
  }, []);

  if (!loading) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none transition-opacity duration-200"
      role="progressbar"
      aria-label="Memuat data..."
    >
      <div className="ee-loader-topbar shadow-sm shadow-blue-500/40" />
    </div>
  );
}
