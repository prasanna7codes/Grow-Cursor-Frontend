import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton,
  Stack,
  Divider,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import api from '../../lib/api';

export default function AwaitingShipmentPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedText, setCopiedText] = useState('');
  const [expandedShipping, setExpandedShipping] = useState({});
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [editingNotes, setEditingNotes] = useState({});

  useEffect(() => {
    fetchAwaitingOrders();
    // eslint-disable-next-line
  }, []);

  async function fetchAwaitingOrders() {
    setLoading(true);
    setError('');
    try {
      // Fetch all orders, filter on client for missing trackingNumber
      const { data } = await api.get('/ebay/stored-orders');
      const filtered = (data?.orders || [])
        .filter(order => !order.trackingNumber || order.trackingNumber === '')
        .sort((a, b) => {
          const aDate = a.shipByDate || a.lineItems?.[0]?.lineItemFulfillmentInstructions?.shipByDate;
          const bDate = b.shipByDate || b.lineItems?.[0]?.lineItemFulfillmentInstructions?.shipByDate;
          return new Date(aDate) - new Date(bDate);
        });
      setOrders(filtered);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load awaiting shipment orders');
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = (text) => {
    const val = text || '-';
    if (val === '-') return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(val);
      setCopiedText(val);
      setTimeout(() => setCopiedText(''), 1200);
    }
  };

  const showSnack = (severity, message) => {
    setSnack({ open: true, severity, message });
    setTimeout(() => setSnack(prev => ({ ...prev, open: false })), 2500);
  };

  const toggleShippingExpanded = (orderId) => {
    setExpandedShipping(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'America/Los_Angeles',
      });
    } catch {
      return '-';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight="bold">Awaiting Shipment</Typography>
          {orders.length > 0 && (
            <Chip label={`${orders.length} awaiting`} color="warning" variant="outlined" />
          )}
        </Stack>
        <Divider sx={{ my: 2 }} />
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        )}
        {loading ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>Loading orders...</Typography>
          </Box>
        ) : orders.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No orders are currently awaiting shipment.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small" sx={{ '& td, & th': { whiteSpace: 'nowrap' } }}>
              <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Seller</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Order ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date Sold</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ship By</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Product Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Buyer Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Zipcode</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Shipping Address</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Manual Tracking</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order, idx) => (
                  <TableRow key={order._id || idx}>
                    <TableCell>
                      {order.seller?.user?.username || order.seller?.user?.email || order.sellerId || '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" sx={{ color: 'primary.main' }}>
                        {order.orderId || order.legacyOrderId || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(order.dateSold)}</TableCell>
                    <TableCell>{formatDate(order.shipByDate || order.lineItems?.[0]?.lineItemFulfillmentInstructions?.shipByDate)}</TableCell>
                    <TableCell>
                      <Tooltip title={order.productName || order.lineItems?.[0]?.title || '-'} arrow>
                        <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                          {order.productName || order.lineItems?.[0]?.title || '-'}
                        </Typography>
                      </Tooltip>
                      <IconButton size="small" onClick={() => handleCopy(order.productName || order.lineItems?.[0]?.title || '-') } aria-label="copy product name">
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={order.buyer?.buyerRegistrationAddress?.fullName || '-'} arrow>
                        <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                          {order.buyer?.buyerRegistrationAddress?.fullName || '-'}
                        </Typography>
                      </Tooltip>
                      <IconButton size="small" onClick={() => handleCopy(order.buyer?.buyerRegistrationAddress?.fullName || '-') } aria-label="copy buyer name">
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Typography variant="body2">{order.shippingPostalCode || order.buyer?.buyerRegistrationAddress?.postalCode || '-'}</Typography>
                        <IconButton size="small" onClick={() => handleCopy(order.shippingPostalCode || order.buyer?.buyerRegistrationAddress?.postalCode || '-') } aria-label="copy postal code">
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </div>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      {expandedShipping[order._id] ? (
                        <Stack spacing={0.5}>
                          {/* Full Name */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Tooltip title={order.shippingFullName || '-'} arrow>
                              <Typography variant="body2" fontWeight="medium" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {order.shippingFullName || '-'}
                              </Typography>
                            </Tooltip>
                            <IconButton size="small" onClick={() => handleCopy(order.shippingFullName)} aria-label="copy name">
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          {/* Address Line 1 */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Tooltip title={order.shippingAddressLine1 || '-'} arrow>
                              <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {order.shippingAddressLine1 || '-'}
                              </Typography>
                            </Tooltip>
                            <IconButton size="small" onClick={() => handleCopy(order.shippingAddressLine1)} aria-label="copy address">
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          {/* Address Line 2 */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Tooltip title={order.shippingAddressLine2 || '-'} arrow>
                              <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {order.shippingAddressLine2 || '-'}
                              </Typography>
                            </Tooltip>
                            <IconButton size="small" onClick={() => handleCopy(order.shippingAddressLine2)} aria-label="copy address line 2">
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          {/* City */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Tooltip title={order.shippingCity || '-'} arrow>
                              <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {order.shippingCity || '-'}
                              </Typography>
                            </Tooltip>
                            <IconButton size="small" onClick={() => handleCopy(order.shippingCity)} aria-label="copy city">
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          {/* State */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Tooltip title={order.shippingState || '-'} arrow>
                              <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {order.shippingState || '-'}
                              </Typography>
                            </Tooltip>
                            <IconButton size="small" onClick={() => handleCopy(order.shippingState)} aria-label="copy state">
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          {/* Postal Code */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Tooltip title={order.shippingPostalCode || '-'} arrow>
                              <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {order.shippingPostalCode || '-'}
                              </Typography>
                            </Tooltip>
                            <IconButton size="small" onClick={() => handleCopy(order.shippingPostalCode)} aria-label="copy postal code">
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          {/* Country */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Tooltip title={order.shippingCountry || '-'} arrow>
                              <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {order.shippingCountry || '-'}
                              </Typography>
                            </Tooltip>
                            <IconButton size="small" onClick={() => handleCopy(order.shippingCountry)} aria-label="copy country">
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          {/* Phone */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Tooltip title={order.shippingPhone || '0000000000'} arrow>
                              <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                📞 {order.shippingPhone || '0000000000'}
                              </Typography>
                            </Tooltip>
                            <IconButton size="small" onClick={() => handleCopy(order.shippingPhone || '0000000000')} aria-label="copy phone">
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          {/* Collapse Button */}
                          <Button 
                            size="small" 
                            onClick={() => toggleShippingExpanded(order._id)}
                            startIcon={<ExpandLessIcon />}
                            sx={{ mt: 0.5 }}
                          >
                            Collapse
                          </Button>
                        </Stack>
                      ) : (
                        <Button 
                          size="small" 
                          onClick={() => toggleShippingExpanded(order._id)}
                          endIcon={<ExpandMoreIcon />}
                          sx={{ textTransform: 'none' }}
                        >
                          {order.shippingFullName || 'View Address'}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <ManualTrackingCell
                        order={order}
                        onSaved={(newVal) => {
                          // update local state for the order
                          setOrders(prev => prev.map(o => (o._id === order._id ? { ...o, manualTrackingNumber: newVal } : o)));
                        }}
                        onCopy={handleCopy}
                        onNotify={showSnack}
                      />
                    </TableCell>

                    {/* Notes Cell */}
                    <TableCell sx={{ minWidth: 200 }}>
                      <NotesCell
                        order={order}
                        onSaved={(newNotes) => {
                          setOrders(prev => prev.map(o => (o._id === order._id ? { ...o, notes: newNotes } : o)));
                        }}
                        onNotify={showSnack}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      <Snackbar open={snack.open} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function ManualTrackingCell({ order, onSaved, onCopy, onNotify }) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(order.manualTrackingNumber || '');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  useEffect(() => {
    setValue(order.manualTrackingNumber || '');
  }, [order.manualTrackingNumber]);

  const startEdit = () => {
    setError('');
    setEditing(true);
  };

  const cancel = () => {
    setValue(order.manualTrackingNumber || '');
    setEditing(false);
    setError('');
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch(`/ebay/orders/${order._id}/manual-tracking`, { manualTrackingNumber: value });
      if (data?.success) {
        onSaved(value);
        setEditing(false);
        onNotify?.('success', 'Manual tracking saved');
      } else {
        setError('Failed to save');
        onNotify?.('error', 'Failed to save manual tracking');
      }
    } catch (e) {
      const msg = e?.response?.data?.error || 'Save failed';
      setError(msg);
      onNotify?.('error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {editing ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={value} onChange={e => setValue(e.target.value)} style={{ padding: 6, minWidth: 160 }} />
          <Button size="small" variant="contained" onClick={save} disabled={saving}>Save</Button>
          <Button size="small" onClick={cancel} disabled={saving}>Cancel</Button>
          {error && <Typography variant="caption" color="error">{error}</Typography>}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Typography variant="body2">{order.manualTrackingNumber || '-'}</Typography>
          <IconButton size="small" onClick={() => onCopy?.(order.manualTrackingNumber || '-') } aria-label="copy manual tracking">
            <ContentCopyIcon fontSize="small" />
          </IconButton>
          <Button size="small" onClick={startEdit}>Edit</Button>
        </div>
      )}
    </div>
  );
}

function NotesCell({ order, onSaved, onNotify }) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(order.notes || '');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  useEffect(() => {
    setValue(order.notes || '');
  }, [order.notes]);

  const startEdit = () => {
    setError('');
    setEditing(true);
  };

  const cancel = () => {
    setValue(order.notes || '');
    setEditing(false);
    setError('');
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch(`/ebay/orders/${order._id}/notes`, { notes: value });
      if (data?.success) {
        onSaved(value);
        setEditing(false);
        onNotify?.('success', 'Notes saved');
      } else {
        setError('Failed to save');
        onNotify?.('error', 'Failed to save notes');
      }
    } catch (e) {
      const msg = e?.response?.data?.error || 'Save failed';
      setError(msg);
      onNotify?.('error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea 
            value={value} 
            onChange={e => setValue(e.target.value)} 
            style={{ padding: 6, minWidth: 180, minHeight: 60, resize: 'vertical' }}
            placeholder="Enter notes..."
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="small" variant="contained" onClick={save} disabled={saving}>Save</Button>
            <Button size="small" onClick={cancel} disabled={saving}>Cancel</Button>
          </div>
          {error && <Typography variant="caption" color="error">{error}</Typography>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Typography variant="body2" sx={{ fontSize: '0.85rem', maxWidth: 200, wordWrap: 'break-word' }}>
            {order.notes || '-'}
          </Typography>
          <Button size="small" onClick={startEdit} sx={{ alignSelf: 'flex-start' }}>
            {order.notes ? 'Edit' : 'Add Notes'}
          </Button>
        </div>
      )}
    </div>
  );
}
