import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Container, Paper, CircularProgress, Alert, Chip, Button,
    Checkbox, FormControl, InputLabel, Select, MenuItem, TextField, Tooltip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, Dialog, DialogTitle, DialogContent, DialogContentText,
    DialogActions, Snackbar, Avatar, Link,
} from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '../../lib/api';

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100];

export default function UnsoldListingsPage() {
    const [sellers, setSellers] = useState([]);
    const [sellerId, setSellerId] = useState('');
    const [categories, setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [selected, setSelected] = useState(new Map()); // groupKey → row
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [snackbar, setSnackbar] = useState(null);

    useEffect(() => {
        api.get('/sellers/all')
            .then(({ data }) => setSellers(data))
            .catch(() => setError('Failed to load sellers.'));
    }, []);

    useEffect(() => {
        const id = window.setTimeout(() => { setSearch(searchInput); setPage(0); }, 400);
        return () => window.clearTimeout(id);
    }, [searchInput]);

    const fetchRows = useCallback(async () => {
        if (!sellerId) { setRows([]); setTotal(0); return; }
        const allSellers = sellerId === 'all';
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/unsold-listings', {
                params: { sellerId: allSellers ? 'all' : sellerId, page: page + 1, limit: rowsPerPage, categoryId, search },
            });
            setRows(data.items || []);
            setTotal(data.total || 0);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load unsold listings.');
            setRows([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [sellerId, page, rowsPerPage, categoryId, search]);

    useEffect(() => { fetchRows(); }, [fetchRows]);

    useEffect(() => {
        if (!sellerId) { setCategories([]); return; }
        api.get('/unsold-listings/categories', { params: { sellerId } })
            .then(({ data }) => setCategories(data))
            .catch(() => setCategories([]));
    }, [sellerId]);

    const handleSellerChange = (value) => {
        setSellerId(value);
        setCategoryId('');
        setSearchInput('');
        setSearch('');
        setPage(0);
        setSelected(new Map());
    };

    const isAllSellers = sellerId === 'all';
    const columnCount = isAllSellers ? 10 : 9;

    // Keyed by seller too: the same ASIN can appear under two sellers in the all-sellers view.
    const rowKey = (row) => `${row.seller}:${row.baseSku || `item:${row.itemId}`}`;

    const toggleRow = (row) => {
        setSelected(prev => {
            const next = new Map(prev);
            const key = rowKey(row);
            if (next.has(key)) next.delete(key); else next.set(key, row);
            return next;
        });
    };

    const pageKeys = rows.map(rowKey);
    const selectedOnPage = pageKeys.filter(k => selected.has(k)).length;
    const allSelected = rows.length > 0 && selectedOnPage === rows.length;
    const someSelected = selectedOnPage > 0 && !allSelected;

    const toggleSelectAll = () => {
        setSelected(prev => {
            const next = new Map(prev);
            if (allSelected) {
                rows.forEach(r => next.delete(rowKey(r)));
            } else {
                rows.forEach(r => next.set(rowKey(r), r));
            }
            return next;
        });
    };

    const selectedRows = useMemo(() => [...selected.values()], [selected]);
    const selectedListingCount = selectedRows.reduce((sum, r) => sum + (r.listingCount || 1), 0);
    const selectedAsins = useMemo(
        () => [...new Set(selectedRows.map(r => r.asin).filter(Boolean))],
        [selectedRows]
    );
    const selectedAsinCount = selectedAsins.length;
    const rowsWithoutAsin = selectedRows.filter(r => !r.asin).length;

    // navigator.clipboard needs a secure context; fall back for plain http origins.
    const copyText = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            try {
                const area = document.createElement('textarea');
                area.value = text;
                area.style.position = 'fixed';
                area.style.opacity = '0';
                document.body.appendChild(area);
                area.select();
                const ok = document.execCommand('copy');
                document.body.removeChild(area);
                return ok;
            } catch {
                return false;
            }
        }
    };

    const handleCopyAsins = async () => {
        if (selectedAsins.length === 0) return;
        const copied = await copyText(selectedAsins.join('\n'));
        setSnackbar(copied
            ? `Copied ${selectedAsins.length} ASIN(s) to clipboard.`
            : 'Could not access the clipboard — select the ASINs in the dialog to copy manually.');
    };

    const handleRemove = async () => {
        setRemoving(true);
        try {
            const itemIds = selectedRows.flatMap(r => r.itemIds?.length ? r.itemIds : [r.itemId]);
            const asinsToCopy = selectedAsins;
            const { data } = await api.post('/unsold-listings/remove', { sellerId, itemIds });

            const copied = asinsToCopy.length > 0 && await copyText(asinsToCopy.join('\n'));
            setSnackbar(
                `Removed ${data.deleted} listing(s).` +
                (copied ? ` ${asinsToCopy.length} ASIN(s) copied to clipboard.` : '') +
                ' They will reappear on the next sync.'
            );

            setSelected(new Map());
            setConfirmOpen(false);
            await fetchRows();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to remove listings.');
        } finally {
            setRemoving(false);
        }
    };

    const categoryLeaf = (name, id) => {
        if (!name) return id || '—';
        const parts = name.split(':');
        return parts[parts.length - 1].trim();
    };

    const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—');

    const formatPrice = (row) => {
        const value = row.priceUSD ?? row.price;
        if (value == null) return '—';
        const currency = row.priceUSD != null ? 'USD' : (row.currency || '');
        return `${value.toFixed(2)} ${currency}`.trim();
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
            <Box mb={3}>
                <Typography variant="h4" fontWeight={700}>Unsold Listings</Typography>
                <Typography variant="body2" color="textSecondary">
                    Review synced unsold (inactive) listings by seller. Each ASIN is shown once —
                    if the same product ended more than once, the latest listing represents it.
                    Run a sync first from the Unsold Sync page.
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

            <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>Seller</InputLabel>
                        <Select
                            label="Seller"
                            value={sellerId}
                            onChange={(e) => handleSellerChange(e.target.value)}
                        >
                            <MenuItem value="all">
                                <em>All sellers</em>
                            </MenuItem>
                            {sellers.map(s => (
                                <MenuItem key={s._id} value={s._id}>
                                    {s.user?.username || s.user?.email || s._id}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 260 }} disabled={!sellerId}>
                        <InputLabel>Category</InputLabel>
                        <Select
                            label="Category"
                            value={categoryId}
                            onChange={(e) => { setCategoryId(e.target.value); setPage(0); }}
                        >
                            <MenuItem value="">All categories</MenuItem>
                            {categories.map(c => (
                                <MenuItem key={c.categoryId} value={c.categoryId}>
                                    {categoryLeaf(c.categoryName, c.categoryId)} ({c.count.toLocaleString()})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        size="small"
                        label="Search title, SKU or item number"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        disabled={!sellerId}
                        sx={{ minWidth: 280 }}
                    />

                    <Box flexGrow={1} />

                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteSweepIcon />}
                        disabled={selected.size === 0}
                        onClick={() => setConfirmOpen(true)}
                    >
                        Remove selected ({selected.size})
                    </Button>
                </Box>
            </Paper>

            <Paper elevation={1} sx={{ borderRadius: 2, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: '65vh' }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox" sx={{ bgcolor: '#f5f5f5' }}>
                                    <Checkbox
                                        size="small"
                                        indeterminate={someSelected}
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                        disabled={rows.length === 0}
                                    />
                                </TableCell>
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 700 }}>Photo</TableCell>
                                {isAllSellers && (
                                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 700 }}>Seller</TableCell>
                                )}
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 700 }}>Title</TableCell>
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 700 }}>Item number</TableCell>
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 700 }}>SKU</TableCell>
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 700 }}>ASIN</TableCell>
                                <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 700 }}>Price</TableCell>
                                <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 700 }}>Category</TableCell>
                                <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 700 }}>Ended</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {!sellerId ? (
                                <TableRow>
                                    <TableCell colSpan={columnCount} align="center" sx={{ py: 6 }}>
                                        <Typography color="text.secondary">Select a seller to view their unsold listings.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : loading ? (
                                <TableRow>
                                    <TableCell colSpan={columnCount} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={28} />
                                    </TableCell>
                                </TableRow>
                            ) : rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columnCount} align="center" sx={{ py: 6 }}>
                                        <Typography color="text.secondary">
                                            {search || categoryId
                                                ? 'No listings match these filters.'
                                                : 'Nothing synced yet for this seller — run a sync from the Unsold Sync page.'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map(row => {
                                    const key = rowKey(row);
                                    const isSelected = selected.has(key);
                                    return (
                                        <TableRow
                                            key={key}
                                            hover
                                            selected={isSelected}
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => toggleRow(row)}
                                        >
                                            <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                                                <Checkbox size="small" checked={isSelected} onChange={() => toggleRow(row)} />
                                            </TableCell>
                                            <TableCell>
                                                <Avatar
                                                    variant="rounded"
                                                    src={row.galleryURL || undefined}
                                                    sx={{ width: 40, height: 40, bgcolor: '#f0f0f0' }}
                                                />
                                            </TableCell>
                                            {isAllSellers && (
                                                <TableCell>
                                                    <Chip label={row.sellerName || '—'} size="small" variant="outlined" />
                                                </TableCell>
                                            )}
                                            <TableCell sx={{ maxWidth: 320 }}>
                                                <Tooltip title={row.title || ''}>
                                                    <Typography variant="body2" noWrap>{row.title || '—'}</Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell onClick={e => e.stopPropagation()}>
                                                {row.viewItemURL ? (
                                                    <Link href={row.viewItemURL} target="_blank" rel="noopener" variant="body2">
                                                        {row.itemId}
                                                    </Link>
                                                ) : (
                                                    <Typography variant="body2">{row.itemId}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <Typography variant="body2">{row.sku || '—'}</Typography>
                                                    {row.listingCount > 1 && (
                                                        <Tooltip title={`This ASIN has ${row.listingCount} ended listings`}>
                                                            <Chip label={`×${row.listingCount}`} size="small" color="warning" variant="outlined" />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell onClick={e => e.stopPropagation()}>
                                                {row.asin ? (
                                                    <Link
                                                        href={`https://www.amazon.com/dp/${row.asin}`}
                                                        target="_blank"
                                                        rel="noopener"
                                                        variant="body2"
                                                    >
                                                        {row.asin}
                                                    </Link>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2">{formatPrice(row)}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 200 }}>
                                                <Tooltip title={row.categoryName || ''}>
                                                    <Typography variant="body2" noWrap>
                                                        {categoryLeaf(row.categoryName, row.categoryId)}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography variant="body2">{formatDate(row.endTime)}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                />
            </Paper>

            <Dialog open={confirmOpen} onClose={() => !removing && setConfirmOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Remove selected listings?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        You selected <strong>{selected.size}</strong> row(s)
                        {selectedAsinCount > 0 && <> covering <strong>{selectedAsinCount}</strong> ASIN(s)</>}
                        {selectedListingCount !== selected.size && <> and <strong>{selectedListingCount}</strong> ended listing(s)</>}
                        . They will no longer be shown here.
                    </DialogContentText>
                    {selectedAsins.length > 0 && (
                        <Box mt={2}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    ASINs being removed ({selectedAsins.length})
                                </Typography>
                                <Button size="small" startIcon={<ContentCopyIcon />} onClick={handleCopyAsins}>
                                    Copy
                                </Button>
                            </Box>
                            <TextField
                                value={selectedAsins.join('\n')}
                                multiline
                                minRows={3}
                                maxRows={8}
                                fullWidth
                                size="small"
                                InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 13 } }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                Copied to your clipboard automatically when you confirm.
                                {rowsWithoutAsin > 0 && ` ${rowsWithoutAsin} selected row(s) have no matching ASIN and are not listed here.`}
                            </Typography>
                        </Box>
                    )}

                    <DialogContentText sx={{ mt: 2 }} variant="body2" color="text.secondary">
                        This only clears them from this view. If they are still unsold on eBay,
                        they will reappear after the next sync.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)} disabled={removing}>Cancel</Button>
                    <Button
                        onClick={handleRemove}
                        color="error"
                        variant="contained"
                        disabled={removing}
                        startIcon={removing ? <CircularProgress size={14} color="inherit" /> : <DeleteSweepIcon />}
                    >
                        {removing ? 'Removing…' : 'Remove'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!snackbar}
                autoHideDuration={5000}
                onClose={() => setSnackbar(null)}
                message={snackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Container>
    );
}
