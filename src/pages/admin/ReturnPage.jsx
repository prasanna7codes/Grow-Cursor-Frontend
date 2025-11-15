import { useEffect, useState } from 'react';
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
  Alert,
  FormControl,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
  TextField,
  Button
} from '@mui/material';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '../../lib/api.js';

export default function ReturnPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingNotes, setEditingNotes] = useState({});
  const [notesValues, setNotesValues] = useState({});

  useEffect(() => {
    fetchReturnOrders();
  }, []);

  const fetchReturnOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/ebay/stored-orders');
      const allOrders = data.orders || [];
      // Filter orders with itemStatus = 'Return'
      const returnOrders = allOrders.filter(order => order.itemStatus === 'Return');
      setOrders(returnOrders);
    } catch (err) {
      console.error('Failed to fetch return orders:', err);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (orderId) => {
    const currentOrder = orders.find(o => o._id === orderId);
    const currentNotes = notesValues[orderId] !== undefined ? notesValues[orderId] : (currentOrder?.notes || '');
    
    if (!currentNotes || currentNotes.trim() === '') {
      alert('Please fill in the notes before resolving the order.');
      return;
    }
    
    try {
      // Save notes first, then update status to Resolved with resolvedFrom
      await api.patch(`/ebay/orders/${orderId}/notes`, { notes: currentNotes });
      await api.patch(`/ebay/orders/${orderId}/item-status`, { 
        itemStatus: 'Resolved',
        resolvedFrom: 'Return'
      });
      // Remove order from list when resolved
      setOrders(prevOrders => prevOrders.filter(o => o._id !== orderId));
      setNotesValues(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      setEditingNotes(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    } catch (err) {
      console.error('Failed to resolve order:', err);
      alert('Failed to resolve order');
    }
  };

  const handleItemStatusChange = async (orderId, newStatus) => {
    // If changing to Resolved, check if notes are filled
    if (newStatus === 'Resolved') {
      const currentOrder = orders.find(o => o._id === orderId);
      const currentNotes = notesValues[orderId] !== undefined ? notesValues[orderId] : (currentOrder?.notes || '');
      
      if (!currentNotes || currentNotes.trim() === '') {
        alert('Please fill in the notes before resolving the order.');
        return;
      }
      
      // Save notes first, then update status
      try {
        await api.patch(`/ebay/orders/${orderId}/notes`, { notes: currentNotes });
        await api.patch(`/ebay/orders/${orderId}/item-status`, { itemStatus: newStatus });
        // Remove order from list when status changes to 'Resolved'
        setOrders(prevOrders => prevOrders.filter(o => o._id !== orderId));
        setNotesValues(prev => {
          const newValues = { ...prev };
          delete newValues[orderId];
          return newValues;
        });
      } catch (err) {
        console.error('Failed to resolve order:', err);
        alert('Failed to resolve order');
      }
    } else {
      // Normal status change
      try {
        await api.patch(`/ebay/orders/${orderId}/item-status`, { itemStatus: newStatus });
        // Remove order from list when status changes away from 'Return'
        if (newStatus !== 'Return') {
          setOrders(prevOrders => prevOrders.filter(o => o._id !== orderId));
        }
      } catch (err) {
        console.error('Failed to update item status:', err);
        alert('Failed to update item status');
      }
    }
  };

  const handleNotesChange = (orderId, value) => {
    setNotesValues(prev => ({ ...prev, [orderId]: value }));
  };

  const handleNotesSave = async (orderId) => {
    const notes = notesValues[orderId];
    if (notes === undefined) return;
    
    try {
      await api.patch(`/ebay/orders/${orderId}/notes`, { notes });
      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(o => (o._id === orderId ? { ...o, notes } : o))
      );
      setEditingNotes(prev => ({ ...prev, [orderId]: false }));
    } catch (err) {
      console.error('Failed to save notes:', err);
      alert('Failed to save notes');
    }
  };

  const handleCopy = (text) => {
    const val = text || '-';
    if (val === '-') return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(val);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date)) return '-';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    if (Number.isNaN(num)) return '-';
    return `$${num.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AssignmentReturnIcon color="error" />
            <Typography variant="h5" fontWeight="bold">Return Orders</Typography>
          </Stack>
          {orders.length > 0 && (
            <Chip
              icon={<AssignmentReturnIcon />}
              label={`${orders.length} return order(s)`}
              color="error"
              variant="outlined"
            />
          )}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AssignmentReturnIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            No orders with Return status found
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small" sx={{ '& td, & th': { whiteSpace: 'nowrap' } }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>SL No</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Seller</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Order ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date Sold</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Product Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Buyer Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Marketplace</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Notes</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order, idx) => {
                const currentNotes = notesValues[order._id] !== undefined ? notesValues[order._id] : (order.notes || '');
                const isEditingNotes = editingNotes[order._id];
                
                return (
                  <TableRow 
                    key={order._id} 
                    sx={{
                      '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                      '&:hover': { backgroundColor: 'action.selected' },
                    }}
                  >
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {order.seller?.user?.username || order.seller?.user?.email || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" sx={{ color: 'primary.main' }}>
                        {order.orderId || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(order.dateSold)}</TableCell>
                    <TableCell sx={{ maxWidth: 250, pr: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                        <Tooltip title={order.productName || '-'} arrow>
                          <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.productName || '-'}
                          </Typography>
                        </Tooltip>
                        <IconButton size="small" onClick={() => handleCopy(order.productName || '-')} aria-label="copy product name">
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 150, pr: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                        <Tooltip title={order.buyer?.username || '-'} arrow>
                          <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.buyer?.username || '-'}
                          </Typography>
                        </Tooltip>
                        <IconButton size="small" onClick={() => handleCopy(order.buyer?.username || '-')} aria-label="copy buyer name">
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{order.purchaseMarketplaceId || '-'}</Typography>
                    </TableCell>
                    
                    <TableCell sx={{ minWidth: 200 }}>
                      {isEditingNotes ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <TextField
                            size="small"
                            multiline
                            rows={2}
                            value={currentNotes}
                            onChange={(e) => handleNotesChange(order._id, e.target.value)}
                            placeholder="Enter notes..."
                            fullWidth
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" variant="contained" onClick={() => handleNotesSave(order._id)}>
                              Save
                            </Button>
                            <Button size="small" onClick={() => {
                              setEditingNotes(prev => ({ ...prev, [order._id]: false }));
                              setNotesValues(prev => {
                                const newValues = { ...prev };
                                delete newValues[order._id];
                                return newValues;
                              });
                            }}>
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem', minHeight: 20 }}>
                            {order.notes || '-'}
                          </Typography>
                          <Button 
                            size="small" 
                            onClick={() => {
                              setEditingNotes(prev => ({ ...prev, [order._id]: true }));
                              setNotesValues(prev => ({ ...prev, [order._id]: order.notes || '' }));
                            }}
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            {order.notes ? 'Edit' : 'Add Notes'}
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleResolve(order._id)}
                      >
                        Resolve
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
