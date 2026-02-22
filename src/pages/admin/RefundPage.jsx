import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Stack, Button, TextField, Select, MenuItem,
    FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, CircularProgress, Chip, Alert, Snackbar,
    Dialog, DialogTitle, DialogContent, DialogActions, Radio, RadioGroup,
    FormControlLabel, Divider, IconButton, Tooltip, Tabs, Tab, Pagination
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HistoryIcon from '@mui/icons-material/History';
import api from '../../lib/api';

const REFUND_REASONS = [
    { value: 'BUYER_CANCEL', label: 'Buyer Cancel' },
    { value: 'SELLER_CANCEL', label: 'Seller Cancel' },
    { value: 'ITEM_NOT_RECEIVED', label: 'Item Not Received' },
    { value: 'ITEM_NOT_AS_DESCRIBED', label: 'Item Not As Described' },
    { value: 'OUT_OF_STOCK_OR_CANNOT_FULFILL', label: 'Out of Stock / Cannot Fulfill' },
    { value: 'BUYER_NOT_SCHEDULED_RETURN', label: 'Buyer Not Scheduled Return' }
];

export default function RefundPage() {
    // Sellers
    const [sellers, setSellers] = useState([]);
    const [selectedSeller, setSelectedSeller] = useState('');

    // Tab
    const [tab, setTab] = useState(0); // 0 = Cancel Requests, 1 = Manual Refund

    // Cancel-requested orders
    const [cancelOrders, setCancelOrders] = useState([]);
    const [loadingCancelOrders, setLoadingCancelOrders] = useState(false);
    const [cancelPage, setCancelPage] = useState(1);
    const [cancelTotalPages, setCancelTotalPages] = useState(1);
    const [cancelTotal, setCancelTotal] = useState(0);

    // Manual order lookup
    const [manualOrderId, setManualOrderId] = useState('');
    const [manualOrders, setManualOrders] = useState([]);
    const [loadingManual, setLoadingManual] = useState(false);

    // Refund dialog
    const [refundDialogOpen, setRefundDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [refundType, setRefundType] = useState('order');
    const [refundReason, setRefundReason] = useState('BUYER_CANCEL');
    const [refundAmount, setRefundAmount] = useState('');
    const [refundCurrency, setRefundCurrency] = useState('USD');
    const [refundComment, setRefundComment] = useState('');
    const [selectedLineItem, setSelectedLineItem] = useState('');
    const [issuingRefund, setIssuingRefund] = useState(false);

    // Confirmation dialog
    const [confirmOpen, setConfirmOpen] = useState(false);

    // History dialog
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [historyOrder, setHistoryOrder] = useState(null);

    // Snackbar
    const [snack, setSnack] = useState({ open: false, severity: 'success', message: '' });

    // Load sellers on mount
    useEffect(() => {
        loadSellers();
    }, []);

    // Load cancel-requested orders when seller changes
    useEffect(() => {
        if (tab === 0) {
            setCancelPage(1);
            fetchCancelOrders(1);
        }
    }, [selectedSeller]);

    useEffect(() => {
        if (tab === 0) {
            fetchCancelOrders(cancelPage);
        }
    }, [cancelPage]);

    const loadSellers = async () => {
        try {
            const { data } = await api.get('/sellers/all');
            setSellers(data || []);
        } catch (err) {
            console.error('Failed to load sellers', err);
        }
    };

    const fetchCancelOrders = async (pg = 1) => {
        setLoadingCancelOrders(true);
        try {
            const params = { page: pg, limit: 25 };
            if (selectedSeller) params.sellerId = selectedSeller;
            const { data } = await api.get('/ebay/refund/eligible-orders', { params });
            setCancelOrders(data.orders || []);
            setCancelTotalPages(data.pagination?.totalPages || 1);
            setCancelTotal(data.pagination?.total || 0);
        } catch (err) {
            console.error('Failed to fetch cancel orders', err);
            showSnack('error', 'Failed to load cancel-requested orders');
        } finally {
            setLoadingCancelOrders(false);
        }
    };

    const searchManualOrder = async () => {
        if (!manualOrderId.trim()) return;
        setLoadingManual(true);
        try {
            const params = { orderId: manualOrderId.trim() };
            if (selectedSeller) params.sellerId = selectedSeller;
            const { data } = await api.get('/ebay/refund/eligible-orders', { params });
            setManualOrders(data.orders || []);
            if ((data.orders || []).length === 0) {
                showSnack('info', 'No orders found for that ID');
            }
        } catch (err) {
            console.error('Failed to search order', err);
            showSnack('error', 'Failed to search for order');
        } finally {
            setLoadingManual(false);
        }
    };

    const openRefundDialog = (order) => {
        setSelectedOrder(order);
        setRefundType('order');
        setRefundReason('BUYER_CANCEL');
        setRefundComment('');
        setSelectedLineItem('');

        // Pre-fill amount from order total
        const total = order.pricingSummary?.total?.value || order.subtotal || '';
        const currency = order.pricingSummary?.total?.currency || 'USD';
        setRefundAmount(total ? String(total) : '');
        setRefundCurrency(currency);
        setRefundDialogOpen(true);
    };

    const handleIssueRefund = () => {
        // Open confirmation before issuing
        setConfirmOpen(true);
    };

    const confirmAndIssue = async () => {
        setConfirmOpen(false);
        setIssuingRefund(true);
        try {
            const payload = {
                sellerId: selectedOrder.sellerObjectId || selectedOrder.seller?._id || selectedOrder.seller,
                orderId: selectedOrder.orderId,
                reasonForRefund: refundReason,
                refundAmount: { value: refundAmount, currency: refundCurrency },
                refundType,
            };
            if (refundComment.trim()) payload.comment = refundComment.trim();
            if (refundType === 'lineItem') payload.lineItemId = selectedLineItem;

            const { data } = await api.post('/ebay/refund/issue', payload);
            showSnack('success', `✅ ${data.message} (ID: ${data.refundId || 'N/A'})`);
            setRefundDialogOpen(false);

            // Refresh the list
            if (tab === 0) fetchCancelOrders(cancelPage);
        } catch (err) {
            const msg = err.response?.data?.details || err.response?.data?.error || 'Refund failed';
            showSnack('error', msg);
        } finally {
            setIssuingRefund(false);
        }
    };

    const openHistoryDialog = (order) => {
        setHistoryOrder(order);
        setHistoryDialogOpen(true);
    };

    const showSnack = (severity, message) => {
        setSnack({ open: true, severity, message });
    };

    const handleCopy = (text) => {
        if (!text || text === '-') return;
        navigator?.clipboard?.writeText(text);
        showSnack('success', 'Copied!');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
            });
        } catch { return '-'; }
    };

    const formatCurrency = (val, curr = 'USD') => {
        if (val === null || val === undefined || val === '') return '-';
        const num = Number(val);
        if (Number.isNaN(num)) return '-';
        return `${curr === 'USD' ? '$' : curr + ' '}${num.toFixed(2)}`;
    };

    const getRefundHistory = (order) => {
        const refunds = [];
        // Order-level refunds
        if (order.paymentSummary?.refunds?.length) {
            refunds.push(...order.paymentSummary.refunds);
        }
        // Line-item level refunds
        if (order.lineItems) {
            order.lineItems.forEach(li => {
                if (li.refunds?.length) {
                    refunds.push(...li.refunds.map(r => ({ ...r, lineItemId: li.lineItemId })));
                }
            });
        }
        return refunds;
    };

    const renderOrderTable = (orders, loading) => {
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (orders.length === 0) {
            return (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <MoneyOffIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">No orders found</Typography>
                </Box>
            );
        }

        return (
            <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                    maxHeight: 'calc(100vh - 380px)',
                    overflow: 'auto',
                    '&::-webkit-scrollbar': { width: '8px', height: '8px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#f1f1f1', borderRadius: '10px' },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#888', borderRadius: '10px',
                        '&:hover': { backgroundColor: '#555' }
                    },
                }}
            >
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            {['Seller', 'Order ID', 'Date Sold', 'Buyer', 'Product', 'Total', 'Cancel Status', 'Refund History', 'Action'].map(h => (
                                <TableCell key={h} sx={{ backgroundColor: 'primary.main', color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map((order, idx) => {
                            const refunds = getRefundHistory(order);
                            const total = order.pricingSummary?.total || {};
                            return (
                                <TableRow key={order._id || idx} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {order.sellerUsername || order.seller?.user?.username || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <Typography variant="body2" fontFamily="monospace" color="primary.main" fontWeight="medium">
                                                {order.orderId || '-'}
                                            </Typography>
                                            <IconButton size="small" onClick={() => handleCopy(order.orderId)}><ContentCopyIcon sx={{ fontSize: 14 }} /></IconButton>
                                        </Stack>
                                    </TableCell>
                                    <TableCell><Typography variant="body2">{formatDate(order.dateSold || order.creationDate)}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{order.buyer?.buyerRegistrationAddress?.fullName || order.buyer?.username || '-'}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 250 }}>
                                        <Tooltip title={order.lineItems?.map(li => li.title).join(', ') || order.productName || '-'} arrow>
                                            <Typography variant="body2" noWrap>{order.lineItems?.[0]?.title || order.productName || '-'}</Typography>
                                        </Tooltip>
                                        {order.lineItems?.length > 1 && (
                                            <Chip label={`+${order.lineItems.length - 1} more`} size="small" sx={{ mt: 0.5 }} />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {formatCurrency(total.value || order.subtotal, total.currency || 'USD')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={order.cancelState || '-'}
                                            size="small"
                                            color={order.cancelState === 'CANCEL_REQUESTED' ? 'warning' : order.cancelState === 'CANCELED' ? 'error' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {refunds.length > 0 ? (
                                            <Chip
                                                icon={<HistoryIcon />}
                                                label={`${refunds.length} refund${refunds.length > 1 ? 's' : ''}`}
                                                size="small"
                                                color="info"
                                                variant="outlined"
                                                onClick={() => openHistoryDialog(order)}
                                                sx={{ cursor: 'pointer' }}
                                            />
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">None</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="error"
                                            startIcon={<MoneyOffIcon />}
                                            onClick={() => openRefundDialog(order)}
                                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                        >
                                            Issue Refund
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Page Header */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <MoneyOffIcon color="error" sx={{ fontSize: 28 }} />
                        <Typography variant="h5" fontWeight="bold">Issue Refunds</Typography>
                    </Stack>
                    <Chip label={`${cancelTotal} cancel requests`} color="warning" variant="outlined" />
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Seller Selector */}
                <Stack direction="row" spacing={2} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 250 }}>
                        <InputLabel>Select Seller</InputLabel>
                        <Select
                            value={selectedSeller}
                            label="Select Seller"
                            onChange={(e) => setSelectedSeller(e.target.value)}
                        >
                            <MenuItem value=""><em>All Sellers</em></MenuItem>
                            {sellers.map(s => (
                                <MenuItem key={s._id} value={s._id}>
                                    {s.user?.username || s.user?.email || s._id}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => tab === 0 ? fetchCancelOrders(cancelPage) : searchManualOrder()}
                        size="small"
                    >
                        Refresh
                    </Button>
                </Stack>
            </Paper>

            {/* Tabs */}
            <Paper sx={{ mb: 2 }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tab label={`Cancel Requests (${cancelTotal})`} />
                    <Tab label="Manual Refund" />
                </Tabs>

                <Box sx={{ p: 2 }}>
                    {/* Tab 0: Cancel Requests */}
                    {tab === 0 && (
                        <>
                            {renderOrderTable(cancelOrders, loadingCancelOrders)}

                            {cancelTotal > 0 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 2 }}>
                                    <Pagination
                                        count={cancelTotalPages}
                                        page={cancelPage}
                                        onChange={(e, p) => setCancelPage(p)}
                                        color="primary"
                                        showFirstButton
                                        showLastButton
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        Showing {(cancelPage - 1) * 25 + 1} - {Math.min(cancelPage * 25, cancelTotal)} of {cancelTotal}
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}

                    {/* Tab 1: Manual Refund */}
                    {tab === 1 && (
                        <>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                <TextField
                                    size="small"
                                    label="Enter Order ID"
                                    value={manualOrderId}
                                    onChange={(e) => setManualOrderId(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchManualOrder()}
                                    placeholder="e.g. 01-12345-67890"
                                    sx={{ minWidth: 300 }}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={loadingManual ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
                                    onClick={searchManualOrder}
                                    disabled={loadingManual || !manualOrderId.trim()}
                                >
                                    Search
                                </Button>
                            </Stack>

                            {renderOrderTable(manualOrders, loadingManual)}
                        </>
                    )}
                </Box>
            </Paper>

            {/* ===== Refund Dialog ===== */}
            <Dialog open={refundDialogOpen} onClose={() => !issuingRefund && setRefundDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <MoneyOffIcon color="error" />
                        <Typography variant="h6">Issue Refund</Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    {selectedOrder && (
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            {/* Order Info */}
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Order Details</Typography>
                                <Stack spacing={0.5}>
                                    <Typography variant="body2"><strong>Order ID:</strong> {selectedOrder.orderId}</Typography>
                                    <Typography variant="body2"><strong>Seller:</strong> {selectedOrder.sellerUsername || '-'}</Typography>
                                    <Typography variant="body2"><strong>Buyer:</strong> {selectedOrder.buyer?.buyerRegistrationAddress?.fullName || '-'}</Typography>
                                    <Typography variant="body2"><strong>Order Total:</strong> {formatCurrency(selectedOrder.pricingSummary?.total?.value || selectedOrder.subtotal, selectedOrder.pricingSummary?.total?.currency || 'USD')}</Typography>
                                </Stack>
                            </Paper>

                            {/* Refund Type */}
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>Refund Level</Typography>
                                <RadioGroup row value={refundType} onChange={(e) => setRefundType(e.target.value)}>
                                    <FormControlLabel value="order" control={<Radio size="small" />} label="Entire Order" />
                                    <FormControlLabel value="lineItem" control={<Radio size="small" />} label="Specific Line Item" />
                                </RadioGroup>
                            </Box>

                            {/* Line Item Selector */}
                            {refundType === 'lineItem' && selectedOrder.lineItems?.length > 0 && (
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Select Line Item</InputLabel>
                                    <Select
                                        value={selectedLineItem}
                                        label="Select Line Item"
                                        onChange={(e) => setSelectedLineItem(e.target.value)}
                                    >
                                        {selectedOrder.lineItems.map((li, i) => (
                                            <MenuItem key={li.lineItemId || i} value={li.lineItemId}>
                                                {li.title || `Item ${i + 1}`} — {formatCurrency(li.total?.value || li.lineItemCost?.value, li.total?.currency || 'USD')}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            {/* Reason */}
                            <FormControl size="small" fullWidth>
                                <InputLabel>Reason for Refund</InputLabel>
                                <Select value={refundReason} label="Reason for Refund" onChange={(e) => setRefundReason(e.target.value)}>
                                    {REFUND_REASONS.map(r => (
                                        <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Amount */}
                            <Stack direction="row" spacing={2} alignItems="center">
                                <TextField
                                    size="small"
                                    label="Refund Amount"
                                    type="number"
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    inputProps={{ step: '0.01', min: '0.01' }}
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    size="small"
                                    label="Currency"
                                    value={refundCurrency}
                                    onChange={(e) => setRefundCurrency(e.target.value)}
                                    sx={{ width: 100 }}
                                />
                            </Stack>

                            {/* Comment */}
                            <TextField
                                size="small"
                                label="Comment (optional, max 100 chars)"
                                multiline
                                rows={2}
                                value={refundComment}
                                onChange={(e) => setRefundComment(e.target.value.substring(0, 100))}
                                helperText={`${refundComment.length}/100`}
                                fullWidth
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setRefundDialogOpen(false)} disabled={issuingRefund}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleIssueRefund}
                        disabled={issuingRefund || !refundAmount || (refundType === 'lineItem' && !selectedLineItem)}
                        startIcon={issuingRefund ? <CircularProgress size={16} color="inherit" /> : <MoneyOffIcon />}
                    >
                        {issuingRefund ? 'Issuing...' : 'Issue Refund'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ===== Confirmation Dialog ===== */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <WarningAmberIcon color="warning" />
                        <Typography variant="h6">Confirm Refund</Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        This action is <strong>irreversible</strong>. The refund will be processed through eBay.
                    </Alert>
                    <Stack spacing={1}>
                        <Typography variant="body2"><strong>Order:</strong> {selectedOrder?.orderId}</Typography>
                        <Typography variant="body2"><strong>Amount:</strong> {formatCurrency(refundAmount, refundCurrency)}</Typography>
                        <Typography variant="body2"><strong>Reason:</strong> {REFUND_REASONS.find(r => r.value === refundReason)?.label}</Typography>
                        <Typography variant="body2"><strong>Type:</strong> {refundType === 'order' ? 'Order Level' : 'Line Item Level'}</Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setConfirmOpen(false)}>Go Back</Button>
                    <Button variant="contained" color="error" onClick={confirmAndIssue} startIcon={<CheckCircleIcon />}>
                        Yes, Issue Refund
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ===== Refund History Dialog ===== */}
            <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <HistoryIcon color="info" />
                        <Typography variant="h6">Refund History — {historyOrder?.orderId}</Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    {historyOrder && (() => {
                        const refunds = getRefundHistory(historyOrder);
                        if (refunds.length === 0) return <Typography color="text.secondary">No refunds recorded</Typography>;
                        return (
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Refund ID</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Line Item</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {refunds.map((r, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Typography variant="body2" fontFamily="monospace">{r.refundId || r.refundReferenceId || '-'}</Typography></TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={r.refundStatus || '-'}
                                                    size="small"
                                                    color={r.refundStatus === 'REFUNDED' ? 'success' : r.refundStatus === 'PENDING' ? 'warning' : 'error'}
                                                />
                                            </TableCell>
                                            <TableCell>{formatCurrency(r.amount?.value, r.amount?.currency || 'USD')}</TableCell>
                                            <TableCell>{formatDate(r.refundDate)}</TableCell>
                                            <TableCell>{r.lineItemId || 'Order Level'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        );
                    })()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snack.open}
                autoHideDuration={4000}
                onClose={() => setSnack(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snack.severity} sx={{ width: '100%' }}>{snack.message}</Alert>
            </Snackbar>
        </Box>
    );
}
