import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  LinearProgress,
  Link,
  Paper,
  Snackbar,
  Stack,
  TablePagination,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ImageIcon from '@mui/icons-material/Image';
import api from '../../lib/api';
import PageHeader from '../../components/PageHeader';
import OrderSparkline from '../../components/OrderSparkline';
import { BRAND_DARK } from '../../constants/brandTheme';

// Seller carries no name of its own — it is identified by the populated user.
// Same derivation as ListingOverlaysPage and SelectSellerPage.
const getSellerDisplayName = (seller) =>
  seller?.user?.username || seller?.user?.email || seller?.name || 'Unknown Seller';

// Amazon marketplace domain per currency, so a card's ASIN links to the
// marketplace the listing actually sells on.
const AMAZON_DOMAINS = { USD: 'com', AUD: 'com.au', CAD: 'ca', GBP: 'co.uk' };

// The SKU index stores a currency, not a country, but EndListingLog records a
// country — mapping it here keeps the country breakdown on End Listing Stats
// populated instead of filing these ends under "Unknown".
const END_LISTING_COUNTRIES = { USD: 'US', GBP: 'UK', AUD: 'AU', CAD: 'Canada' };

// The 90-day count is the number you actually decide on, so it leads: heavier
// and a size up. Lifetime is background context and is stepped down.
const ORDERS_90D_CHIP_SX = {
  fontWeight: 900,
  fontSize: '0.85rem',
  height: 26,
  '& .MuiChip-label': { px: 1.25 }
};
const LIFETIME_CHIP_SX = {
  fontWeight: 600,
  fontSize: '0.68rem',
  height: 20,
  color: 'text.secondary',
  borderColor: 'divider',
  '& .MuiChip-label': { px: 0.75 }
};

// Card width. The image is the main visual, so the card is sized for it: a
// ~240px square is large enough to judge a product picture at a glance, and
// four to six of them fit a normal screen without scrolling sideways.
const CARD_MIN_WIDTH = 236;

const formatSyncedAgo = (isoDate) => {
  if (!isoDate) return 'just now';
  const minutes = Math.round((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

function amazonUrl(asin, currency) {
  const domain = AMAZON_DOMAINS[String(currency || '').toUpperCase()] || 'com';
  return asin ? `https://www.amazon.${domain}/dp/${asin}` : '';
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatPrice(price, currency) {
  if (price === null || price === undefined || price === '') return '-';
  const value = Number(price);
  if (Number.isNaN(value)) return '-';
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`.trim();
}

// The index stores eBay's gallery thumbnail (s-l140 / s-l225), which goes soft
// when blown up to a card. eBay serves every picture at any of its standard
// widths under the same path, so the same image is asked for at 500px; a URL
// that does not follow that pattern is left alone.
function cardImageUrl(url) {
  return String(url || '').replace(/\/s-l\d+\.(jpe?g|png|webp)$/i, '/s-l500.$1');
}

/**
 * One listing. The picture fills the top, the details sit underneath, and the
 * whole card is a click target for selection — the links and the End button
 * stop the click so they do not also toggle the tick.
 */
function ListingCard({ row, selected, endedInfo, failReason, rowBusy, busy, onToggle, onEnd }) {
  const [imgSrc, setImgSrc] = useState(() => cardImageUrl(row.imageUrl));
  const selectable = !endedInfo && !rowBusy && !busy;
  const stop = (event) => event.stopPropagation();

  return (
    <Paper
      variant="outlined"
      onClick={() => { if (selectable) onToggle(row); }}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: selectable ? 'pointer' : 'default',
        opacity: endedInfo ? 0.55 : 1,
        borderWidth: 2,
        borderColor: selected ? '#dc2626' : 'divider',
        bgcolor: selected ? '#fef2f2' : '#fff',
        transition: 'border-color 120ms, box-shadow 120ms',
        '&:hover': selectable ? { boxShadow: 3, borderColor: selected ? '#dc2626' : '#94a3b8' } : undefined
      }}
    >
      <Box sx={{ position: 'relative', aspectRatio: '1 / 1', bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider' }}>
        {imgSrc ? (
          <Box
            component="img"
            src={imgSrc}
            alt={row.title || 'listing image'}
            loading="lazy"
            // The 500px rendition is standard, but if eBay has nothing at that
            // size for this picture the indexed thumbnail is still shown.
            onError={() => { if (imgSrc !== row.imageUrl) setImgSrc(row.imageUrl); }}
            sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f1f5f9' }}>
            <ImageIcon sx={{ fontSize: 56, color: '#cbd5e1' }} />
          </Box>
        )}
        <Checkbox
          size="medium"
          disabled={!selectable}
          checked={selected && !endedInfo}
          onChange={() => onToggle(row)}
          onClick={stop}
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            p: 0.5,
            bgcolor: 'rgba(255,255,255,0.9)',
            borderRadius: 1,
            '&:hover': { bgcolor: '#fff' },
            '&.Mui-checked': { color: '#dc2626' }
          }}
        />
        <Chip
          size="small"
          label={formatPrice(row.price, row.currency)}
          sx={{ position: 'absolute', top: 8, right: 8, fontWeight: 800, bgcolor: 'rgba(15,23,42,0.85)', color: '#fff' }}
        />
        {endedInfo && (
          <Tooltip title={`Ended by ${endedInfo.endedBy || 'unknown'} on ${formatDateTime(endedInfo.endedAt)}`}>
            <Chip
              size="small"
              color="error"
              label="Ended"
              sx={{ position: 'absolute', bottom: 8, left: 8, fontWeight: 800 }}
            />
          </Tooltip>
        )}
      </Box>

      <Stack spacing={0.75} sx={{ p: 1.25, flex: 1 }}>
        <Tooltip title={row.title || ''} enterDelay={600}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              lineHeight: 1.3,
              minHeight: '2.6em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {row.title || '-'}
          </Typography>
        </Tooltip>

        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.secondary' }} noWrap>
          {row.sku || '—'}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Link
            href={`https://www.ebay.com/itm/${row.itemId}`}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            onClick={stop}
            sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 0.25 }}
          >
            {row.itemId}
            <OpenInNewIcon sx={{ fontSize: 12 }} />
          </Link>
          {row.asin ? (
            <Link
              href={amazonUrl(row.asin, row.currency)}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              onClick={stop}
              sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: 0.25 }}
            >
              {row.asin}
              <OpenInNewIcon sx={{ fontSize: 12 }} />
            </Link>
          ) : (
            <Typography variant="caption" color="text.disabled">no ASIN</Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={0.75} alignItems="center">
          <Chip
            size="small"
            color={row.orderCount90d > 0 ? 'warning' : 'default'}
            label={`${formatNumber(row.orderCount90d)} / 90d`}
            sx={ORDERS_90D_CHIP_SX}
          />
          <Chip
            size="small"
            variant="outlined"
            label={`${formatNumber(row.lifetimeOrderCount)} lifetime`}
            sx={LIFETIME_CHIP_SX}
          />
          <Box sx={{ flex: 1 }} />
          <OrderSparkline monthly={row.monthlyOrders} />
        </Stack>

        {endedInfo && (
          <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700 }}>
            Ended by {endedInfo.endedBy || 'unknown'} &middot; {formatDateTime(endedInfo.endedAt)}
          </Typography>
        )}
        {failReason && (
          <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700 }}>
            End failed: {failReason} — use End to retry
          </Typography>
        )}

        <Box sx={{ flex: 1 }} />
        {!endedInfo && (
          <Button
            size="small"
            color="error"
            variant="outlined"
            fullWidth
            startIcon={rowBusy ? <CircularProgress size={14} color="inherit" /> : <CancelIcon />}
            disabled={rowBusy || busy}
            onClick={(event) => { stop(event); onEnd(row); }}
          >
            End Listing
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

/**
 * Pick a seller, find their listings by words in the title, and end the ones
 * you tick. Rows come from SellerSkuIndex (the daily SKU Index Sync) with the
 * same order history the SKU Listing Manager shows, so a listing that still
 * sells is visible as such before it is ended.
 */
export default function KeywordEndListingPage() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const actorName = user?.username || user?.name || user?.email || 'you';

  const [sellers, setSellers] = useState([]);
  const [sellerId, setSellerId] = useState('');
  // Per-seller row counts and last sync time, read from SellerSkuIndex.
  const [indexBySeller, setIndexBySeller] = useState({});

  const [keywordQuery, setKeywordQuery] = useState('');
  const [categoryQuery, setCategoryQuery] = useState('');

  const [result, setResult] = useState(null); // null = nothing searched yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Actions taken this session, keyed by item id. Kept separately from the
  // search result so a card reflects what just happened without a re-search.
  const [endedItems, setEndedItems] = useState({});
  const [failedItems, setFailedItems] = useState({});
  const [endingItemId, setEndingItemId] = useState(null);

  const [selectedIds, setSelectedIds] = useState(() => new Set());
  // Every end goes through one confirmation, whether it is a single card's
  // End Listing button or the selection bar. `single` decides which handler
  // runs on confirm: the one-row path reports "Ended item X" without the
  // bulk progress bar.
  const [pendingEnd, setPendingEnd] = useState(null); // null | { rows, single }
  const [bulkProgress, setBulkProgress] = useState(null); // { total, done, ok }

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(48);

  useEffect(() => {
    Promise.all([
      api.get('/sellers/all'),
      api.get('/keyword-end-listing/index-status')
    ]).then(([sellerRes, indexRes]) => {
      setSellers(sellerRes.data || []);
      const byId = {};
      (indexRes.data?.sellers || []).forEach((row) => {
        byId[row.sellerId] = { count: row.count, syncedAt: row.syncedAt };
      });
      setIndexBySeller(byId);
    }).catch(() => setError('Failed to load sellers or the SKU index status'));
  }, []);

  const sellerIndex = sellerId ? indexBySeller[sellerId] : null;
  const listings = result?.listings || [];

  const runSearch = useCallback(async () => {
    if (!sellerId) { setError('Select a seller first'); return; }
    const search = keywordQuery.trim();
    const category = categoryQuery.trim();
    if (!search && !category) { setError('Enter a keyword or a category to search for'); return; }

    setLoading(true);
    setError('');
    setSuccess('');
    // A fresh search is a fresh set of rows — session action state from the
    // previous search would otherwise badge unrelated listings.
    setEndedItems({});
    setFailedItems({});
    setSelectedIds(new Set());
    setPage(0);
    try {
      const { data } = await api.get('/keyword-end-listing/search', { params: { sellerId, search, category } });
      setResult(data);
      if (data.indexEmpty) {
        setError('No listings indexed for this seller yet. They appear after the next SKU Index Sync.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to search listings');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [sellerId, keywordQuery, categoryQuery]);

  const isEnded = useCallback(
    (row) => Boolean(endedItems[row.itemId] || row.endedInfo),
    [endedItems]
  );

  // Cards currently rendered.
  const pagedListings = useMemo(
    () => listings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [listings, page, rowsPerPage]
  );

  const toggleSelect = useCallback((row) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(row.itemId)) next.delete(row.itemId);
      else next.add(row.itemId);
      return next;
    });
  }, []);

  // "Select page" acts on the cards on screen only — the safe default when the
  // alternative silently selects 1,000 live listings. Selecting everything is
  // a separate, explicit button.
  const pageSelectable = pagedListings.filter((row) => !isEnded(row));
  const pageAllSelected = pageSelectable.length > 0 && pageSelectable.every((row) => selectedIds.has(row.itemId));
  const togglePageSelection = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const row of pageSelectable) {
        if (pageAllSelected) next.delete(row.itemId);
        else next.add(row.itemId);
      }
      return next;
    });
  };

  const selectableCount = useMemo(() => listings.filter((row) => !isEnded(row)).length, [listings, isEnded]);
  const selectAllMatching = () => {
    setSelectedIds(new Set(listings.filter((row) => !isEnded(row)).map((row) => row.itemId)));
  };

  const selectedRows = useMemo(
    () => listings.filter((row) => selectedIds.has(row.itemId) && !isEnded(row)),
    [listings, selectedIds, isEnded]
  );
  const selectedCount = selectedRows.length;
  const selectedWithOrders90d = selectedRows.filter((row) => (row.orderCount90d || 0) > 0).length;

  const endOne = async (row) => {
    await api.post('/ebay/end-item', {
      sellerId: row.sellerId,
      itemId: row.itemId,
      source: 'keyword_end_listing',
      sku: row.sku || '',
      country: END_LISTING_COUNTRIES[String(row.currency || '').toUpperCase()] || ''
    });
    setEndedItems((prev) => ({
      ...prev,
      [row.itemId]: { endedAt: new Date().toISOString(), endedBy: actorName }
    }));
    setFailedItems((prev) => {
      if (!prev[row.itemId]) return prev;
      const next = { ...prev };
      delete next[row.itemId];
      return next;
    });
    setSelectedIds((prev) => {
      if (!prev.has(row.itemId)) return prev;
      const next = new Set(prev);
      next.delete(row.itemId);
      return next;
    });
  };

  const handleEndItem = async (row) => {
    setError('');
    setSuccess('');
    setEndingItemId(row.itemId);
    try {
      await endOne(row);
      setSuccess(`Ended item ${row.itemId}`);
    } catch (err) {
      const reason = err.response?.data?.error || err.message || 'Failed to end item';
      setFailedItems((prev) => ({ ...prev, [row.itemId]: reason }));
      setError(`Failed to end item ${row.itemId}: ${reason}`);
    } finally {
      setEndingItemId(null);
    }
  };

  // Ended one at a time rather than in parallel: each call is a live eBay
  // write, and a burst of them risks tripping call limits mid-way through.
  const handleBulkEnd = async (rows) => {
    if (!rows.length) return;
    setError('');
    setSuccess('');
    setBulkProgress({ total: rows.length, done: 0, ok: 0 });
    let okCount = 0;
    const failures = [];
    for (const row of rows) {
      setEndingItemId(row.itemId);
      try {
        await endOne(row);
        okCount += 1;
      } catch (err) {
        const reason = err.response?.data?.error || err.message || 'Unknown error';
        failures.push(`${row.itemId} (${reason})`);
        setFailedItems((prev) => ({ ...prev, [row.itemId]: reason }));
      }
      setBulkProgress((prev) => (prev ? { ...prev, done: prev.done + 1, ok: okCount } : prev));
    }
    setEndingItemId(null);
    setBulkProgress(null);
    if (failures.length) {
      setError(`Ended ${okCount} of ${rows.length} listing(s). Failed: ${failures.join('; ')}`);
    } else {
      setSuccess(`Ended all ${okCount} listing(s).`);
    }
  };

  const confirmPendingEnd = () => {
    const pending = pendingEnd;
    setPendingEnd(null);
    if (!pending) return;
    if (pending.single) handleEndItem(pending.rows[0]);
    else handleBulkEnd(pending.rows);
  };

  const busy = Boolean(bulkProgress);
  const pendingRows = pendingEnd?.rows || [];
  const pendingWithOrders90d = pendingRows.filter((row) => (row.orderCount90d || 0) > 0).length;
  const canSearch = Boolean(sellerId && sellerIndex && (keywordQuery.trim() || categoryQuery.trim()));

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Keyword End Listing"
        subtitle="Pick a seller, find their listings by words in the title, check how each one has sold, and end the ones you tick."
      />

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
      </Snackbar>

      {/* ── Find ──────────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        {/* Index state for the selected seller. Read-only: this page searches
            what the daily SKU Index Sync maintains rather than crawling eBay,
            so freshness is reported but not controlled from here. */}
        {sellerId && (
          <Alert severity={sellerIndex ? 'success' : 'warning'} sx={{ mb: 2 }}>
            {sellerIndex
              ? `${sellerIndex.count.toLocaleString()} listings indexed · synced ${formatSyncedAgo(sellerIndex.syncedAt)}`
              : 'No listings indexed for this seller yet. They appear after the next SKU Index Sync.'}
          </Alert>
        )}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} flexWrap="wrap" useFlexGap>
          <Autocomplete
            sx={{ minWidth: 260 }}
            options={sellers}
            getOptionLabel={getSellerDisplayName}
            // Two sellers can share a username, so the key comes from _id
            // rather than the label MUI would otherwise fall back to.
            renderOption={(props, option) => {
              const { key: _ignored, ...rest } = props;
              return <li key={option._id} {...rest}>{getSellerDisplayName(option)}</li>;
            }}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            value={sellers.find((s) => s._id === sellerId) || null}
            onChange={(_, v) => setSellerId(v?._id || '')}
            disabled={loading || busy}
            renderInput={(params) => <TextField {...params} label="Seller" size="small" />}
          />

          <TextField
            size="small"
            label="Title keywords"
            placeholder="phone case · strap,band"
            value={keywordQuery}
            onChange={(e) => setKeywordQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canSearch && !loading && !busy) runSearch(); }}
            sx={{ flex: 1, minWidth: 260 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              )
            }}
          />

          <TextField
            size="small"
            label="Category contains"
            placeholder="optional · e.g. Smart Watches"
            value={categoryQuery}
            onChange={(e) => setCategoryQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canSearch && !loading && !busy) runSearch(); }}
            sx={{ minWidth: 220 }}
          />

          <Button
            variant="contained"
            onClick={runSearch}
            disabled={!canSearch || loading || busy}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            sx={{ backgroundColor: BRAND_DARK }}
          >
            {loading ? 'Searching…' : 'Find listings'}
          </Button>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          Keywords match the listing title only. <strong>phone case</strong> needs both words (any order) ·{' '}
          <strong>strap,band</strong> matches either · <strong>apple strap,apple band</strong> combines the two.
          Listings come from the seller&apos;s last SKU Index Sync, so one listed after this morning&apos;s run
          appears tomorrow.
        </Typography>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {bulkProgress && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 800, mb: 1 }}>
            Ending listings… {bulkProgress.done} of {bulkProgress.total} ({bulkProgress.ok} succeeded)
          </Typography>
          <LinearProgress variant="determinate" value={(bulkProgress.done / bulkProgress.total) * 100} />
        </Paper>
      )}

      {/* Sticky so the End button stays reachable while scrolling a long grid. */}
      {!bulkProgress && selectedCount > 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 1.5, mb: 2, borderRadius: 2, borderColor: '#fecaca', bgcolor: '#fef2f2', position: 'sticky', top: 8, zIndex: 2 }}
        >
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {selectedCount} listing{selectedCount === 1 ? '' : 's'} selected
              {selectedWithOrders90d > 0 && (
                <Typography component="span" variant="body2" sx={{ ml: 1, color: 'warning.dark', fontWeight: 700 }}>
                  · {selectedWithOrders90d} sold in the last 90 days
                </Typography>
              )}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button size="small" onClick={() => setSelectedIds(new Set())}>Clear</Button>
            <Button
              size="small"
              color="error"
              variant="contained"
              startIcon={<CancelIcon />}
              onClick={() => setPendingEnd({ rows: selectedRows, single: false })}
            >
              End selected
            </Button>
          </Stack>
        </Paper>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && result && !result.indexEmpty && !listings.length && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="text.secondary">
            None of <b>{result.sellerName}</b>&apos;s {formatNumber(result.scanned)} indexed listings match. Try a broader keyword.
          </Typography>
        </Paper>
      )}

      {/* ── Results ───────────────────────────────────────────────────── */}
      {!loading && listings.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {formatNumber(result.matched)} of {formatNumber(result.scanned)} listing{result.scanned === 1 ? '' : 's'} match
              for <b>{result.sellerName}</b>
            </Typography>
            <Chip
              size="small"
              color={result.totals?.orderCount90d > 0 ? 'warning' : 'default'}
              label={`${formatNumber(result.totals?.orderCount90d)} orders / 90d`}
              sx={ORDERS_90D_CHIP_SX}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`${formatNumber(result.totals?.lifetimeOrderCount)} lifetime`}
              sx={LIFETIME_CHIP_SX}
            />
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              variant="outlined"
              onClick={togglePageSelection}
              disabled={busy || pageSelectable.length === 0}
            >
              {pageAllSelected ? 'Unselect page' : `Select page (${pageSelectable.length})`}
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={selectAllMatching}
              disabled={busy || selectableCount === 0 || selectedCount === selectableCount}
            >
              Select all {formatNumber(selectableCount)}
            </Button>
            <Tooltip title="Most recent SKU Index Sync covering these listings" arrow>
              <Typography variant="caption" color="text.secondary">
                synced {formatDateTime(result.syncedAt)}
              </Typography>
            </Tooltip>
          </Stack>

          {result.truncated && (
            <Alert severity="info" sx={{ mb: 1.5 }}>
              Showing the first {formatNumber(result.returned)} of {formatNumber(result.matched)} matches — narrow the
              keyword to see the rest.
            </Alert>
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_MIN_WIDTH}px, 1fr))`,
              gap: 1.5
            }}
          >
            {pagedListings.map((row) => (
              <ListingCard
                key={row.itemId}
                row={row}
                selected={selectedIds.has(row.itemId)}
                endedInfo={endedItems[row.itemId] || row.endedInfo}
                failReason={!isEnded(row) ? failedItems[row.itemId] : null}
                rowBusy={endingItemId === row.itemId}
                busy={busy}
                onToggle={toggleSelect}
                onEnd={(row) => setPendingEnd({ rows: [row], single: true })}
              />
            ))}
          </Box>

          <TablePagination
            component="div"
            count={listings.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[24, 48, 96, 240]}
            labelRowsPerPage="Cards per page"
            sx={{ mt: 1 }}
          />
        </Paper>
      )}

      <Dialog open={Boolean(pendingEnd)} onClose={() => setPendingEnd(null)} fullWidth maxWidth="sm">
        <DialogTitle>End {pendingRows.length} listing{pendingRows.length === 1 ? '' : 's'}?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This ends the {pendingRows.length === 1 ? 'listing' : 'selected eBay listings'} for good.
            {pendingWithOrders90d > 0
              ? (pendingRows.length === 1
                ? ' It sold in the last 90 days — worth a second look.'
                : ` ${pendingWithOrders90d} of them sold in the last 90 days — worth a second look.`)
              : ' Listings that have sold recently are worth a second look.'}
          </Alert>
          {pendingEnd?.single ? (
            // One listing: show it properly, picture and all, so what is about
            // to be ended is unmistakable.
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              {pendingRows[0].imageUrl ? (
                <Box
                  component="img"
                  src={cardImageUrl(pendingRows[0].imageUrl)}
                  alt=""
                  sx={{ width: 96, height: 96, objectFit: 'contain', borderRadius: 1, border: '1px solid', borderColor: 'divider', flexShrink: 0 }}
                />
              ) : (
                <Box sx={{ width: 96, height: 96, borderRadius: 1, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ImageIcon sx={{ fontSize: 32, color: '#cbd5e1' }} />
                </Box>
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{pendingRows[0].title || '-'}</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', mt: 0.5 }}>
                  {pendingRows[0].itemId} · {pendingRows[0].sku || '—'}
                  {pendingRows[0].asin ? ` · ${pendingRows[0].asin}` : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {formatPrice(pendingRows[0].price, pendingRows[0].currency)}
                  {' · '}{formatNumber(pendingRows[0].orderCount90d)} order{pendingRows[0].orderCount90d === 1 ? '' : 's'} in 90d
                  {' · '}{formatNumber(pendingRows[0].lifetimeOrderCount)} lifetime
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Stack spacing={0.5}>
              {pendingRows.slice(0, 100).map((row) => (
                <Typography key={row.itemId} variant="caption" sx={{ fontFamily: 'monospace' }}>
                  {row.itemId} · {row.sku || '—'}
                  {row.orderCount90d > 0 ? ` · ${row.orderCount90d} order(s) in 90d` : ''}
                </Typography>
              ))}
              {pendingRows.length > 100 && (
                <Typography variant="caption" color="text.secondary">
                  …and {pendingRows.length - 100} more.
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingEnd(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmPendingEnd}>
            {pendingRows.length === 1 ? 'End listing' : 'End listings'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
