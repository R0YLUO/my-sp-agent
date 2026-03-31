'use client';

import { useState, useEffect } from 'react';
import { FarmDetails } from '../types/chat';

// ---------------------------------------------------------------------------
// Field configuration — drives the form layout
// ---------------------------------------------------------------------------

interface FieldConfig {
  key: keyof FarmDetails;
  label: string;
  type: 'text' | 'number';
  step?: string;
}

const FIELD_CONFIG: FieldConfig[] = [
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'pasture_type', label: 'Pasture Type', type: 'text' },
  { key: 'grazing_area_hectares', label: 'Grazing Area (hectares)', type: 'number' },
  { key: 'livestock_head_count', label: 'Livestock Head Count', type: 'number' },
  { key: 'livestock_breed', label: 'Livestock Breed', type: 'text' },
  { key: 'livestock_class', label: 'Livestock Class', type: 'text' },
  { key: 'livestock_avg_weight_kg', label: 'Average Weight (kg)', type: 'number' },
  {
    key: 'seasonal_condition_decile',
    label: 'Seasonal Condition (Decile)',
    type: 'number',
    step: '0.01',
  },
  { key: 'month', label: 'Month', type: 'text' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  open: boolean;
  onClose: () => void;
  farmDetails: FarmDetails | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  onSave: (data: Partial<FarmDetails>) => Promise<FarmDetails>;
}

export default function FarmDetailsDrawer({
  open,
  onClose,
  farmDetails,
  loading,
  saving,
  error,
  onSave,
}: Props) {
  // Local form state — synced from server data when the drawer opens
  const [formData, setFormData] = useState<FarmDetails | null>(null);

  // Sync server data → local form whenever the drawer opens or data arrives
  useEffect(() => {
    if (open && farmDetails) {
      setFormData({ ...farmDetails });
    }
  }, [open, farmDetails]);

  const handleChange = (key: keyof FarmDetails, value: string) => {
    if (!formData) return;
    const field = FIELD_CONFIG.find((f) => f.key === key);
    const parsed = field?.type === 'number' ? Number(value) : value;
    setFormData({ ...formData, [key]: parsed });
  };

  const handleSave = async () => {
    if (!formData) return;
    try {
      await onSave(formData);
      onClose();
    } catch {
      // error state is set by the hook
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <aside
        className={`${
          open ? 'translate-x-0' : 'translate-x-full'
        } fixed inset-y-0 right-0 z-40 w-full max-w-md transform bg-white shadow-xl transition-transform duration-200 flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">My Farm Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close drawer"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <p className="text-sm text-gray-400 text-center py-8">
              Loading farm details...
            </p>
          )}

          {!loading && !formData && (
            <p className="text-sm text-gray-400 text-center py-8">
              Unable to load farm details.
            </p>
          )}

          {!loading && formData && (
            <div className="space-y-4">
              {FIELD_CONFIG.map(({ key, label, type, step }) => (
                <div key={key}>
                  <label
                    htmlFor={`farm-${key}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {label}
                  </label>
                  <input
                    id={`farm-${key}`}
                    type={type}
                    step={step}
                    value={formData[key] ?? ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !formData}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </aside>
    </>
  );
}
