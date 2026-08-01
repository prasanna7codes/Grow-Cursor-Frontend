import { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Container, Paper, CircularProgress, Alert,
    Chip, Button, LinearProgress, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import api, { getAuthToken } from '../../lib/api';

export default function UnsoldSyncPage() {
    const [sellers, setSellers] = useState([]);
    const [sellerState, setSellerState] = useState({});
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [error, setError] = useState(null);

    const readerRefs = useRef({});

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get('/sellers/all');
                setSellers(data);
                await Promise.all(data.map(s => fetchStatus(s._id)));
            } catch {
                setError('Failed to load sellers.');
            } finally {
                setLoadingInitial(false);
            }
        };
        load();
        const readers = readerRefs.current;
        return () => {
            Object.values(readers).forEach(r => { try { r.cancel(); } catch { /* already closed */ } });
        };
    }, []);

    const fetchStatus = async (sellerId) => {
        try {
            const { data } = await api.get(`/unsold-listings/sync/status/${sellerId}`);
            setSellerState(prev => ({
                ...prev,
                [sellerId]: {
                    status: data.status === 'running'
                        ? 'running'
                        : data.partial ? 'partial' : data.dbCount > 0 ? 'completed' : 'idle',
                    dbCount: data.dbCount,
                    staleCount: data.staleCount || 0,
                    syncedAt: data.syncedAt || null,
                    progress: data.progress || null,
                    errorMsg: data.error || null,
                },
            }));
        } catch {
            // non-fatal: leave as idle
        }
    };

    const handleSync = async (sellerId) => {
        setSellerState(prev => ({
            ...prev,
            [sellerId]: {
                ...prev[sellerId],
                status: 'running',
                progress: null,
                errorMsg: null,
                warning: null,
            },
        }));

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/unsold-listings/sync/stream?sellerId=${sellerId}`,
                { headers: { Authorization: `Bearer ${getAuthToken()}` } }
            );

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || `Request failed (${response.status})`);
            }

            const reader = response.body.getReader();
            readerRefs.current[sellerId] = reader;
            const decoder = new TextDecoder();
            let buffer = '';
            let sawTerminalEvent = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const evt = JSON.parse(line.slice(6));

                    if (evt.type === 'progress') {
                        setSellerState(prev => ({
                            ...prev,
                            [sellerId]: { ...prev[sellerId], status: 'running', progress: evt },
                        }));
                    } else if (evt.type === 'warning') {
                        setSellerState(prev => ({
                            ...prev,
                            [sellerId]: { ...prev[sellerId], warning: evt.message },
                        }));
                    } else if (evt.type === 'done') {
                        sawTerminalEvent = true;
                        setSellerState(prev => ({
                            ...prev,
                            [sellerId]: {
                                ...prev[sellerId],
                                status: 'completed',
                                dbCount: evt.totalCount,
                                syncedAt: evt.syncedAt,
                                progress: null,
                            },
                        }));
                    } else if (evt.type === 'error') {
                        sawTerminalEvent = true;
                        throw new Error(evt.error);
                    }
                }
            }

            // Stream closed without a done/error event — the server restarted or the
            // connection dropped. Without this the row would sit on "Syncing…" forever.
            if (!sawTerminalEvent) {
                throw new Error('Connection to the server was lost — the sync did not finish. Previously synced data is intact; re-sync to bring it fully up to date.');
            }
        } catch (err) {
            setSellerState(prev => ({
                ...prev,
                [sellerId]: { ...prev[sellerId], status: 'failed', errorMsg: err.message, progress: null },
            }));
        } finally {
            delete readerRefs.current[sellerId];
        }
    };

    const formatDate = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—');

    const renderProgress = (prog) => {
        if (!prog) return 'Connecting…';
        if (prog.phase === 'categories') {
            return `Resolving categories ${prog.resolved} / ${prog.totalToResolve}`;
        }
        return `Page ${prog.page} / ${prog.totalPages} · ${(prog.count || 0).toLocaleString()} listings`;
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
            <Box mb={3}>
                <Typography variant="h4" fontWeight={700}>Unsold Sync</Typography>
                <Typography variant="body2" color="textSecondary">
                    Pull each seller&apos;s unsold (inactive) eBay listings into the local DB.
                    Covers a rolling 60-day window — eBay&apos;s maximum for this data.
                    View the results on the Unsold Listings page.
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Paper elevation={1} sx={{ borderRadius: 2, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 700 }}>Seller</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Unsold Listings</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>Last Synced</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loadingInitial ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={28} />
                                        <Typography variant="body2" sx={{ mt: 1 }}>Loading sellers…</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : sellers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>No sellers found</TableCell>
                                </TableRow>
                            ) : (
                                sellers.map(seller => {
                                    const sid = seller._id;
                                    const s = sellerState[sid] || { status: 'idle', dbCount: 0, syncedAt: null };
                                    const isRunning = s.status === 'running';
                                    const prog = s.progress;
                                    const pct = prog?.phase === 'items' && prog?.totalPages > 0
                                        ? Math.round((prog.page / prog.totalPages) * 100)
                                        : 0;

                                    return (
                                        <TableRow key={sid} sx={{ '&:last-child td': { border: 0 } }}>
                                            <TableCell>
                                                <Typography fontWeight={600}>
                                                    {seller.user?.username || seller.user?.email || seller._id}
                                                </Typography>
                                            </TableCell>

                                            <TableCell align="right">
                                                <Typography variant="body2">
                                                    {s.dbCount > 0 ? s.dbCount.toLocaleString() : '—'}
                                                </Typography>
                                            </TableCell>

                                            <TableCell align="center">
                                                <Typography variant="body2" color={s.syncedAt ? 'text.primary' : 'text.disabled'}>
                                                    {formatDate(s.syncedAt)}
                                                </Typography>
                                            </TableCell>

                                            <TableCell align="center" sx={{ minWidth: 220 }}>
                                                {isRunning ? (
                                                    <Box>
                                                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {renderProgress(prog)}
                                                            </Typography>
                                                            {pct > 0 && (
                                                                <Typography variant="caption" color="text.secondary">{pct}%</Typography>
                                                            )}
                                                        </Box>
                                                        <LinearProgress
                                                            variant={pct > 0 ? 'determinate' : 'indeterminate'}
                                                            value={pct}
                                                            sx={{ height: 6, borderRadius: 3 }}
                                                        />
                                                    </Box>
                                                ) : s.status === 'completed' ? (
                                                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                                        <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                                        <Chip label="Synced" color="success" size="small" variant="outlined" />
                                                    </Box>
                                                ) : s.status === 'partial' ? (
                                                    <Box>
                                                        <Chip label="Partially synced" color="warning" size="small" variant="outlined" />
                                                        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={0.5}>
                                                            {s.staleCount?.toLocaleString()} row(s) from an earlier run — last sync did not finish. Re-sync to refresh.
                                                        </Typography>
                                                    </Box>
                                                ) : s.status === 'failed' ? (
                                                    <Box>
                                                        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                                            <ErrorOutlineIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                                            <Chip label="Failed" color="error" size="small" variant="outlined" />
                                                        </Box>
                                                        <Typography variant="caption" color="error.main" display="block" textAlign="center" mt={0.5}>
                                                            {s.errorMsg || 'Unknown error'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                                                            Previously synced data intact — re-sync to retry.
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Chip label="Not synced" size="small" variant="outlined" sx={{ color: 'text.disabled' }} />
                                                )}

                                                {s.warning && (
                                                    <Alert severity="warning" sx={{ mt: 1, py: 0, fontSize: 12 }}>
                                                        {s.warning}
                                                    </Alert>
                                                )}
                                            </TableCell>

                                            <TableCell align="center">
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={isRunning ? <CircularProgress size={14} color="inherit" /> : <SyncIcon />}
                                                    onClick={() => handleSync(sid)}
                                                    disabled={isRunning}
                                                    sx={{ minWidth: 100 }}
                                                >
                                                    {isRunning ? 'Syncing…' : 'Sync'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Container>
    );
}
