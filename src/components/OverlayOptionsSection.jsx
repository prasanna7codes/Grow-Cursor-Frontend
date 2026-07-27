import { useEffect, useState } from 'react';
import {
  Alert, Box, Checkbox, FormControl, FormControlLabel, InputLabel,
  MenuItem, Paper, Select, Stack, TextField, Typography
} from '@mui/material';
import api from '../lib/api.js';

const ANCHORS = [
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'top-right', label: 'Top right' },
  { value: 'top-left', label: 'Top left' },
];

// Matches DEFAULT_PLACEMENT in the backend's overlayCompositor.
const DEFAULT_SCALE = 0.26;
const DEFAULT_ANCHOR = 'bottom-right';
const DEFAULT_MARGIN = 0.015;

/**
 * Choose which overlay badges this template offers. The badge itself is picked
 * per batch on the Template Listings page — this only decides what's on offer.
 */
export default function OverlayOptionsSection({ options = [], onChange }) {
  const [badges, setBadges] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    api.get('/listing-templates/overlay-badges')
      .then(({ data }) => {
        if (!cancelled) setBadges(data.badges || []);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load the overlay badge list');
      });

    return () => { cancelled = true; };
  }, []);

  const findOption = (badgeKey) => options.find(o => o.badgeKey === badgeKey);

  const toggleBadge = (badge, enabled) => {
    if (enabled) {
      onChange([
        ...options,
        {
          badgeKey: badge.key,
          label: badge.label,
          scale: DEFAULT_SCALE,
          anchor: DEFAULT_ANCHOR,
          margin: DEFAULT_MARGIN,
          // First badge enabled becomes the default, since a template that
          // offers exactly one badge and applies none is never what was meant.
          isDefault: options.length === 0,
        },
      ]);
    } else {
      onChange(options.filter(o => o.badgeKey !== badge.key));
    }
  };

  // Exactly one default, enforced here and again server-side. Behaves like a
  // radio: choosing one clears the rest, and unchecking leaves the template
  // with no automatic overlay at all.
  const setDefault = (badgeKey, isDefault) => {
    onChange(options.map(o => ({ ...o, isDefault: isDefault && o.badgeKey === badgeKey })));
  };

  const updateOption = (badgeKey, patch) => {
    onChange(options.map(o => (o.badgeKey === badgeKey ? { ...o, ...patch } : o)));
  };

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2">Image Overlays</Typography>

      <Alert severity="info">
        The badge is composited onto the <strong>main image only</strong>, but every
        image is then hosted by eBay — a listing cannot mix eBay-hosted and external
        pictures. Mark one badge as the default and it applies to every ASIN added
        under this template, on every page. Leave none marked to turn overlays off.
      </Alert>

      {loadError && <Alert severity="warning">{loadError}</Alert>}

      {badges.length === 0 && !loadError && (
        <Typography variant="body2" color="text.secondary">
          No overlay badges are registered.
        </Typography>
      )}

      {badges.map((badge) => {
        const option = findOption(badge.key);

        return (
          <Paper key={badge.key} variant="outlined" sx={{ p: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(option)}
                  onChange={(e) => toggleBadge(badge, e.target.checked)}
                />
              }
              label={badge.label || badge.key}
            />

            {option && (
              <Box sx={{ pl: 4, pt: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(option.isDefault)}
                      onChange={(e) => setDefault(badge.key, e.target.checked)}
                    />
                  }
                  label="Apply automatically to every batch"
                />

                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <TextField
                    label="Size (% of longest edge)"
                    size="small"
                    type="number"
                    sx={{ width: 200 }}
                    inputProps={{ min: 5, max: 100, step: 1 }}
                    value={Math.round((option.scale ?? DEFAULT_SCALE) * 100)}
                    onChange={(e) => {
                      const pct = Number(e.target.value);
                      if (!Number.isFinite(pct)) return;
                      // Server clamps too, but keeping the UI in range avoids
                      // saving a template that then gets rejected.
                      const clamped = Math.min(Math.max(pct, 5), 100);
                      updateOption(badge.key, { scale: clamped / 100 });
                    }}
                    helperText="26% is the tested default"
                  />

                  <FormControl size="small" sx={{ width: 200 }}>
                    <InputLabel>Position</InputLabel>
                    <Select
                      label="Position"
                      value={option.anchor || DEFAULT_ANCHOR}
                      onChange={(e) => updateOption(badge.key, { anchor: e.target.value })}
                    >
                      {ANCHORS.map(a => (
                        <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Box>
            )}
          </Paper>
        );
      })}
    </Stack>
  );
}
