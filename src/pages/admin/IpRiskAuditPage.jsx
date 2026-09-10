import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, FormControlLabel, InputLabel, LinearProgress,
  Link, MenuItem, Paper, Select, Snackbar, Stack, Switch, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography
} from '@mui/material';
import {
  Block as EndIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import api, { getAuthToken } from '../../lib/api.js';
import AdminPageShell from '../../components/AdminPageShell.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { tableHeaderCellSx, tableContainerSx, yellowFilledButtonSx, yellowOutlinedButtonSx } from '../../theme/tableStyles.js';

// Seller carries no name of its own — it is identified by the populated user.
const getSellerDisplayName = (seller) =>
  seller?.user?.username || seller?.user?.email || seller?.name || 'Unknown Seller';

const LEVEL_CHIP = {
  high: { label: 'High: photo matched to brand', color: 'error', variant: 'filled' },
  medium: { label: 'Medium: photo reused elsewhere', color: 'warning', variant: 'outlined' },
  low: { label: 'Low', color: 'success', variant: 'outlined' },
  error: { label: 'Check failed', color: 'default', variant: 'outlined' },
  unchecked: { label: 'Unchecked', color: 'default', variant: 'outlined' }
};

const ENDING_REASONS = [
  { value: 'NotAvailable', label: 'Item is no longer available' },
  { value: 'Incorrect', label: 'Listing contained an error' },
  { value: 'OtherListingError', label: 'Other listing error' }
];

const formatRiskTooltip = (row) => {
  const lines = [];
  if (Array.isArray(row.reasons) && row.reasons.length > 0) lines.push(...row.reasons);
  if (Array.isArray(row.brandHits) && row.brandHits.length > 0) lines.push(`Blocked brands: ${row.brandHits.join(', ')}`);
  if (Array.isArray(row.matchedDomains) && row.matchedDomains.length > 0) lines.push(`Hosts: ${row.matchedDomains.join(', ')}`);
  if (Array.isArray(row.bestGuessLabels) && row.bestGuessLabels.length > 0) lines.push(`Google labels: ${row.bestGuessLabels.join(' | ')}`);
  if (row.amazonBrand) lines.push(`Amazon brand: ${row.amazonBrand}`);
  lines.push(`${row.imagesChecked || 0} photo(s) checked${row.source === 'asin-cache' ? ' (verdict reused from an earlier check of this ASIN)' : ''}`);
  if (row.endError) lines.push(`Last end attempt failed: ${row.endError}`);
  return lines.join('\n');
};

const formatSyncedAgo = (isoDate) => {
  if (!isoDate) return 'never';
  const minutes = Math.round((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 0)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

export default function IpRiskAuditPage() {
  const [sellers, setSellers] = useState([]);
  const [sellerId, setSellerId] = useState('');
  const [status, setStatus] = useState({ enabled: null, provider: '', bySeller: {}, indexBySeller: {}, imagesPerListing: 1, creditsPerImage: 1 });

  const [categoryQuery, setCategoryQuery] = useState('');
  const [keywordQuery, setKeywordQuery] = useState('');
  const [runLimit, setRunLimit] = useState(300);
  const [recheck, setRecheck] = useState(false);
  const [includeChecked, setIncludeChecked] = useState(true);

  const [rows, setRows] = useState([]);
  const [running, setRunning] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [runSummary, setRunSummary] = useState(null);

  const [levelFilter, setLevelFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [endingReason, setEndingReason] = useState('NotAvailable');
  const [ending, setEnding] = useState(false);
  const [endResult, setEndResult] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const esRef = useRef(null);
  const doneRef = useRef(false);

  const refreshStatus = () => {
    api.get('/ip-risk-audit/status')
      .then(({ data }) => setStatus({
        enabled: Boolean(data.enabled),
        provider: data.provider || '',
        bySeller: data.bySeller || {},
        indexBySeller: data.indexBySeller || {},
        imagesPerListing: data.imagesPerListing || 1,
        creditsPerImage: data.creditsPerImage || 1
      }))
      .catch(() => {});
  };

  useEffect(() => {
    api.get('/sellers/all')
      .then(({ data }) => setSellers(data || []))
      .catch(() => setError('Failed to load sellers'));
    refreshStatus();
    return () => { if (esRef.current) esRef.current.close(); };
  }, []);

  const sellerStats = sellerId ? status.bySeller[sellerId] : null;
  const sellerIndex = sellerId ? status.indexBySeller[sellerId] : null;

  const upsertRow = (item) => {
    setRows((prev) => {
      const index = prev.findIndex((row) => row.itemId === item.itemId);
      if (index === -1) return [...prev, item];
      const next = [...prev];
      next[index] = { ...prev[index], ...item };
      return next;
    });
  };

  const stopRun = () => {
    doneRef.current = true;
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setRunning(false);
  };

  const runAudit = () => {
    if (!sellerId) { setError('Select a seller first'); return; }
    if (status.enabled === false) { setError('Set GOOGLE_VISION_API_KEY on the server to run the reverse-image check.'); return; }

    if (esRef.current) esRef.current.close();
    doneRef.current = false;
    setError('');
    setSuccess('');
    setRows([]);
    setSelectedIds(new Set());
    setPage(0);
    setRunSummary(null);
    setEndResult(null);
    setProgress({ current: 0, total: 0 });
    setRunning(true);

    const url = `${api.defaults.baseURL}/ip-risk-audit/stream`
      + `?sellerId=${encodeURIComponent(sellerId)}`
      + `&category=${encodeURIComponent(categoryQuery.trim())}`
      + `&search=${encodeURIComponent(keywordQuery.trim())}`
      + `&limit=${encodeURIComponent(runLimit)}`
      + `&recheck=${recheck ? 'true' : 'false'}`
      + `&includeChecked=${includeChecked ? 'true' : 'false'}`
      + `&token=${encodeURIComponent(getAuthToken())}`;

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      if (event.data === '[DONE]') {
        es.close();
        esRef.current = null;
        setRunning(false);
        refreshStatus();
        return;
      }
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'started':
            setProgress({ current: 0, total: msg.total || 0 });
            if (msg.indexEmpty) {
              setError('No listings stored for this seller yet. Run the SKU Index Sync first.');
            }
            break;
          case 'item':
            upsertRow(msg.item);
            setProgress({ current: msg.progress || 0, total: msg.total || 0 });
            break;
          case 'complete':
            doneRef.current = true;
            setRunSummary(msg);
            break;
          case 'error':
            doneRef.current = true;
            setError(msg.error || 'Audit failed');
            break;
          default:
            break;
        }
      } catch {
        // A malformed frame should not kill an otherwise healthy run.
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setRunning(false);
      if (!doneRef.current) setError('Connection lost while auditing. Results so far are saved; run again to continue.');
    };
  };

  const loadSavedResults = () => {
    if (!sellerId) { setError('Select a seller first'); return; }
    setError('');
    setLoadingResults(true);
    setRunSummary(null);
    setEndResult(null);
    api.get('/ip-risk-audit/results', { params: { sellerId } })
      .then(({ data }) => {
        setRows(data.rows || []);
        setSelectedIds(new Set());
        setPage(0);
        setSuccess(`Loaded ${(data.rows || []).length.toLocaleString()} saved result(s). ${data.ended || 0} already ended from this page.`);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load saved results'))
      .finally(() => setLoadingResults(false));
  };

  const activeRows = useMemo(() => rows.filter((row) => !row.endedAt), [rows]);

  const counts = useMemo(() => {
    const next = { high: 0, medium: 0, low: 0, error: 0, unchecked: 0 };
    activeRows.forEach((row) => { next[row.level] = (next[row.level] || 0) + 1; });
    return next;
  }, [activeRows]);

  const visibleRows = useMemo(() => {
    const filtered = levelFilter === 'all' ? activeRows : activeRows.filter((row) => row.level === levelFilter);
    // Worst first, so the listings to act on are at the top of every page.
    const rank = { high: 0, medium: 1, error: 2, unchecked: 3, low: 4 };
    return [...filtered].sort((a, b) => (rank[a.level] ?? 9) - (rank[b.level] ?? 9));
  }, [activeRows, levelFilter]);

  const pagedRows = useMemo(
    () => visibleRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [visibleRows, page, rowsPerPage]
  );

  const toggleRow = (itemId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const selectLevel = (level) => {
    setSelectedIds(new Set(activeRows.filter((row) => row.level === level).map((row) => row.itemId)));
  };

  const togglePage = () => {
    const pageIds = pagedRows.map((row) => row.itemId);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => { if (allSelected) next.delete(id); else next.add(id); });
      return next;
    });
  };

  const selectedRows = useMemo(
    () => activeRows.filter((row) => selectedIds.has(row.itemId)),
    [activeRows, selectedIds]
  );

  const endSelected = async () => {
    setConfirmOpen(false);
    if (selectedRows.length === 0) return;
    setEnding(true);
    setError('');
    setEndResult(null);

    const itemIds = selectedRows.map((row) => row.itemId);
    const outcomes = [];
    try {
      // The server caps a request at 200; chunk so a big selection still goes.
      for (let index = 0; index < itemIds.length; index += 200) {
        const chunk = itemIds.slice(index, index + 200);
        const { data } = await api.post('/ip-risk-audit/end', { sellerId, itemIds: chunk, endingReason });
        outcomes.push(...(data.results || []));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ending listings failed part-way; the rows still shown were not ended.');
    }

    const endedIds = new Set(outcomes.filter((outcome) => outcome.success).map((outcome) => outcome.itemId));
    const failures = outcomes.filter((outcome) => !outcome.success);

    setRows((prev) => prev.map((row) => {
      if (endedIds.has(row.itemId)) return { ...row, endedAt: new Date().toISOString(), endError: '' };
      const failure = failures.find((outcome) => outcome.itemId === row.itemId);
      return failure ? { ...row, endError: failure.error } : row;
    }));
    setSelectedIds(new Set());
    setEndResult({ ended: endedIds.size, failed: failures.length, failures });
    setEnding(false);
    refreshStatus();
    if (endedIds.size > 0) setSuccess(`Ended ${endedIds.size} listing(s) on eBay.`);
  };

  const estimatedCost = useMemo(() => {
    if (!sellerIndex?.count) return null;
    const unchecked = Math.max(0, (sellerIndex.count || 0) - (sellerStats?.total || 0));
    return { unchecked, photos: Math.min(unchecked, runLimit) * status.imagesPerListing };
  }, [sellerIndex, sellerStats, runLimit, status.imagesPerListing]);

  return (
    <AdminPageShell>
      <PageHeader title="IP Risk Audit" />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Snackbar
        open={Boolean(success)}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        message={success}
      />

      {status.enabled === false && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          The reverse-image check is not configured on the server. It uses the Scrapingdog key already set for Amazon data (Google Lens), or GOOGLE_VISION_API_KEY if you prefer Google Cloud. Saved results can still be viewed.
        </Alert>
      )}

      <Paper sx={{ p: 2.5, mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Reverse-image searches each live listing's photos and flags the ones a rights owner's crawler would tie to a brand.
          Listings already checked are skipped, so each run continues where the last one stopped. High-risk rows can be ended from here.
        </Typography>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', lg: 'center' }} flexWrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel>Seller</InputLabel>
            <Select value={sellerId} label="Seller" onChange={(event) => { setSellerId(event.target.value); setRows([]); setSelectedIds(new Set()); setRunSummary(null); }}>
              {sellers.map((seller) => {
                const stats = status.bySeller[seller._id];
                return (
                  <MenuItem key={seller._id} value={seller._id}>
                    {getSellerDisplayName(seller)}
                    {stats?.high ? ` — ${stats.high} high` : ''}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Category contains"
            value={categoryQuery}
            onChange={(event) => setCategoryQuery(event.target.value)}
            sx={{ minWidth: 200 }}
          />
          <TextField
            size="small"
            label="Keyword (title / SKU / item id)"
            value={keywordQuery}
            onChange={(event) => setKeywordQuery(event.target.value)}
            sx={{ minWidth: 240 }}
          />
          <TextField
            size="small"
            type="number"
            label="Listings to check this run"
            value={runLimit}
            onChange={(event) => setRunLimit(Math.min(5000, Math.max(1, Number(event.target.value) || 1)))}
            inputProps={{ min: 1, max: 5000 }}
            sx={{ width: 190 }}
          />
          <FormControlLabel
            control={<Switch checked={includeChecked} onChange={(event) => setIncludeChecked(event.target.checked)} />}
            label="Show already-checked"
          />
          <Tooltip title="Ignore stored verdicts and send every matched listing's photos to Google again. Costs a Vision call per photo." arrow>
            <FormControlLabel
              control={<Switch checked={recheck} onChange={(event) => setRecheck(event.target.checked)} />}
              label="Re-check"
            />
          </Tooltip>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mt: 2 }}>
          {running ? (
            <Button variant="outlined" color="warning" startIcon={<StopIcon />} onClick={stopRun}>
              Stop
            </Button>
          ) : (
            <Button variant="contained" startIcon={<PlayIcon />} onClick={runAudit} disabled={!sellerId || status.enabled === false} sx={yellowFilledButtonSx}>
              Run audit
            </Button>
          )}
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadSavedResults} disabled={!sellerId || running || loadingResults} sx={yellowOutlinedButtonSx}>
            Load saved results
          </Button>
          {sellerIndex && (
            <Typography variant="caption" color="text.secondary">
              {sellerIndex.count.toLocaleString()} listings in the SKU index (synced {formatSyncedAgo(sellerIndex.syncedAt)})
              {sellerStats ? ` · ${sellerStats.total.toLocaleString()} checked · ${sellerStats.high} high · ${sellerStats.ended} ended` : ''}
              {estimatedCost ? ` · this run sends up to ${estimatedCost.photos.toLocaleString()} photos${status.provider === 'scrapingdog' ? ` (≈${(estimatedCost.photos * status.creditsPerImage).toLocaleString()} Scrapingdog credits via Google Lens)` : status.provider === 'vision' ? ' (Google Vision)' : ''}` : ''}
            </Typography>
          )}
        </Stack>

        {(running || progress.total > 0) && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant={progress.total > 0 ? 'determinate' : 'indeterminate'}
              value={progress.total > 0 ? Math.min(100, (progress.current / progress.total) * 100) : 0}
            />
            <Typography variant="caption" color="text.secondary">
              {progress.total > 0
                ? `${progress.current.toLocaleString()} of ${progress.total.toLocaleString()} listings`
                : 'Scanning the SKU index…'}
            </Typography>
          </Box>
        )}

        {runSummary && (
          <Alert severity={runSummary.counts?.high ? 'warning' : 'success'} sx={{ mt: 2 }}>
            Scanned {runSummary.scanned.toLocaleString()} stored listings, matched {runSummary.matched.toLocaleString()}.
            {' '}Checked {runSummary.checked.toLocaleString()} now ({runSummary.counts?.high || 0} high, {runSummary.counts?.medium || 0} medium, {runSummary.counts?.low || 0} low
            {runSummary.counts?.error ? `, ${runSummary.counts.error} failed` : ''}).
            {runSummary.skippedFresh > 0 ? ` ${runSummary.skippedFresh.toLocaleString()} already had a fresh result.` : ''}
            {runSummary.skippedEnded > 0 ? ` ${runSummary.skippedEnded.toLocaleString()} already ended.` : ''}
            {runSummary.remaining > 0 ? ` ${runSummary.remaining.toLocaleString()} still unchecked — run again to continue.` : ''}
          </Alert>
        )}

        {endResult && (
          <Alert severity={endResult.failed ? 'warning' : 'success'} sx={{ mt: 2 }} onClose={() => setEndResult(null)}>
            Ended {endResult.ended} listing(s).
            {endResult.failed ? ` ${endResult.failed} failed: ${endResult.failures.slice(0, 3).map((f) => `${f.itemId} (${f.error})`).join('; ')}${endResult.failures.length > 3 ? '…' : ''}` : ''}
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }} flexWrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Show</InputLabel>
            <Select value={levelFilter} label="Show" onChange={(event) => { setLevelFilter(event.target.value); setPage(0); }}>
              <MenuItem value="all">All ({activeRows.length})</MenuItem>
              <MenuItem value="high">High ({counts.high})</MenuItem>
              <MenuItem value="medium">Medium ({counts.medium})</MenuItem>
              <MenuItem value="low">Low ({counts.low})</MenuItem>
              <MenuItem value="error">Failed ({counts.error})</MenuItem>
            </Select>
          </FormControl>
          <Button size="small" variant="outlined" color="error" onClick={() => selectLevel('high')} disabled={counts.high === 0}>
            Select all high ({counts.high})
          </Button>
          <Button size="small" variant="outlined" onClick={() => setSelectedIds(new Set())} disabled={selectedIds.size === 0}>
            Clear selection
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            color="error"
            startIcon={ending ? <CircularProgress size={16} color="inherit" /> : <EndIcon />}
            onClick={() => setConfirmOpen(true)}
            disabled={selectedRows.length === 0 || ending || running}
          >
            End {selectedRows.length > 0 ? `${selectedRows.length} ` : ''}selected on eBay
          </Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper} sx={tableContainerSx}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={tableHeaderCellSx}>
                <Checkbox
                  size="small"
                  checked={pagedRows.length > 0 && pagedRows.every((row) => selectedIds.has(row.itemId))}
                  indeterminate={pagedRows.some((row) => selectedIds.has(row.itemId)) && !pagedRows.every((row) => selectedIds.has(row.itemId))}
                  onChange={togglePage}
                  disabled={pagedRows.length === 0}
                />
              </TableCell>
              <TableCell sx={tableHeaderCellSx}>Photo</TableCell>
              <TableCell sx={tableHeaderCellSx}>Item</TableCell>
              <TableCell sx={tableHeaderCellSx}>SKU / ASIN</TableCell>
              <TableCell sx={tableHeaderCellSx}>Title</TableCell>
              <TableCell sx={tableHeaderCellSx}>Risk</TableCell>
              <TableCell sx={tableHeaderCellSx}>Evidence</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    {running || loadingResults ? 'Working…' : 'No results yet. Run an audit or load saved results for a seller.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {pagedRows.map((row) => {
              const chip = LEVEL_CHIP[row.level] || LEVEL_CHIP.unchecked;
              return (
                <TableRow key={row.itemId} hover selected={selectedIds.has(row.itemId)}>
                  <TableCell padding="checkbox">
                    <Checkbox size="small" checked={selectedIds.has(row.itemId)} onChange={() => toggleRow(row.itemId)} />
                  </TableCell>
                  <TableCell sx={{ width: 84 }}>
                    {row.imageUrl ? (
                      <Box component="img" src={row.imageUrl} alt={row.itemId} sx={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 1, bgcolor: '#fff' }} />
                    ) : (
                      <Typography variant="caption" color="text.secondary">No image</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Link href={`https://www.ebay.com/itm/${row.itemId}`} target="_blank" rel="noreferrer" underline="hover" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {row.itemId}
                    </Link>
                    {row.source === 'asin-cache' && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>verdict reused</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{row.sku || '—'}</Typography>
                    {row.asin && (
                      <Link href={`https://www.amazon.com/dp/${row.asin}`} target="_blank" rel="noreferrer" underline="hover" variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {row.asin}
                      </Link>
                    )}
                    {row.amazonBrand && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{row.amazonBrand}</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ minWidth: 240, maxWidth: 480 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.35 }}>{row.title || '—'}</Typography>
                    {row.categoryName && (
                      <Typography variant="caption" color="text.secondary">{row.categoryName}</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title={<Box sx={{ whiteSpace: 'pre-line' }}>{formatRiskTooltip(row)}</Box>} arrow>
                      <Chip size="small" label={chip.label} color={chip.color} variant={chip.variant} sx={{ fontWeight: 700 }} />
                    </Tooltip>
                    {row.endError && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>End failed</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ minWidth: 220, maxWidth: 420 }}>
                    <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'pre-line' }}>
                      {(row.reasons || []).slice(0, 2).join('\n') || '—'}
                    </Typography>
                    {Array.isArray(row.matchedDomains) && row.matchedDomains.length > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {row.matchedDomains.slice(0, 4).join(', ')}{row.matchedDomains.length > 4 ? '…' : ''}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={visibleRows.length}
          page={page}
          onPageChange={(event, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }}
          rowsPerPageOptions={[25, 50, 100, 250]}
        />
      </TableContainer>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>End {selectedRows.length} listing(s) on eBay?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This ends the selected listings for {getSellerDisplayName(sellers.find((seller) => seller._id === sellerId))} immediately. Ended listings cannot be reopened; they would need to be relisted.
          </Typography>
          {selectedRows.some((row) => row.level !== 'high') && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {selectedRows.filter((row) => row.level !== 'high').length} of the selected rows are not high risk.
            </Alert>
          )}
          <FormControl size="small" fullWidth>
            <InputLabel>Ending reason</InputLabel>
            <Select value={endingReason} label="Ending reason" onChange={(event) => setEndingReason(event.target.value)}>
              {ENDING_REASONS.map((reason) => (
                <MenuItem key={reason.value} value={reason.value}>{reason.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={endSelected}>End listings</Button>
        </DialogActions>
      </Dialog>
    </AdminPageShell>
  );
}
