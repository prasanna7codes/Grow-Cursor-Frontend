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
  Button,
  Stack,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import api from '../../lib/api';

export default function ReturnRequestedPage() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // Filter by return status

  useEffect(() => {
    loadStoredReturns();
  }, [statusFilter]);

  async function loadStoredReturns() {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      
      const res = await api.get('/ebay/stored-returns', { params });
      const returnData = res.data.returns || [];
      console.log(`Loaded ${returnData.length} returns from database`);
      setReturns(returnData);
    } catch (e) {
      console.error('Failed to load returns:', e);
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReturnsFromEbay() {
    setFetching(true);
    setError('');
    setSnackbarMsg('');
    try {
      const res = await api.post('/ebay/fetch-returns');
      const { totalNewReturns, totalUpdatedReturns, results, errors } = res.data;
      
      let msg = `✅ Fetch complete!\n`;
      msg += `New returns: ${totalNewReturns}\n`;
      msg += `Updated returns: ${totalUpdatedReturns}\n\n`;
      
      if (results && results.length > 0) {
        results.forEach(r => {
          msg += `${r.sellerName}: ${r.newReturns} new, ${r.updatedReturns} updated\n`;
        });
      }
      
      if (errors && errors.length > 0) {
        msg += `\n⚠️ Errors:\n${errors.join('\n')}`;
      }
      
      setSnackbarMsg(msg);
      
      // Reload returns from database
      await loadStoredReturns();
    } catch (e) {
      console.error('Failed to fetch returns:', e);
      setError(e.response?.data?.error || e.message);
    } finally {
      setFetching(false);
    }
  }

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
      const d = new Date(dateStr);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return '-';
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    const s = status.toUpperCase();
    if (s.includes('OPEN') || s.includes('PENDING')) return 'warning';
    if (s.includes('CLOSED') || s.includes('RESOLVED')) return 'success';
    if (s.includes('CANCELLED') || s.includes('DENIED')) return 'error';
    return 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <AssignmentReturnIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4">Return Requests</Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {snackbarMsg && (
        <Alert 
          severity="info" 
          sx={{ mb: 2, whiteSpace: 'pre-line' }} 
          onClose={() => setSnackbarMsg('')}
        >
          {snackbarMsg}
        </Alert>
      )}

      {/* Controls */}
      <Stack direction="row" spacing={2} mb={3} alignItems="center">
        <Button
          variant="contained"
          color="primary"
          startIcon={fetching ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
          onClick={fetchReturnsFromEbay}
          disabled={fetching}
        >
          {fetching ? 'Fetching Returns...' : 'Fetch Returns from eBay'}
        </Button>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status Filter"
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="RETURN_OPEN">Open</MenuItem>
            <MenuItem value="RETURN_CLOSED">Closed</MenuItem>
            <MenuItem value="SELLER_CLOSED">Seller Closed</MenuItem>
            <MenuItem value="RETURN_SHIPPED">Shipped</MenuItem>
            <MenuItem value="REFUND_PENDING">Refund Pending</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="body2" color="text.secondary">
          Total: {returns.length} returns
        </Typography>
      </Stack>

      {/* Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Return ID</strong></TableCell>
                <TableCell><strong>Order ID</strong></TableCell>
                <TableCell><strong>Seller</strong></TableCell>
                <TableCell><strong>Buyer</strong></TableCell>
                <TableCell><strong>Item</strong></TableCell>
                <TableCell><strong>Reason</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Refund Amount</strong></TableCell>
                <TableCell><strong>Created Date</strong></TableCell>
                <TableCell><strong>Response Due</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography variant="body2" color="text.secondary" py={2}>
                      No return requests found. Click "Fetch Returns from eBay" to load data.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                returns.map((ret) => (
                  <TableRow key={ret._id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {ret.returnId || '-'}
                        </Typography>
                        <IconButton size="small" onClick={() => handleCopy(ret.returnId)}>
                          <ContentCopyIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {ret.orderId || '-'}
                        </Typography>
                        <IconButton size="small" onClick={() => handleCopy(ret.orderId)}>
                          <ContentCopyIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{ret.seller?.user?.username || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{ret.buyerUsername || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={ret.itemTitle || 'N/A'}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 150, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {ret.itemTitle || ret.itemId || '-'}
                        </Typography>
                      </Tooltip>
                      {ret.returnQuantity && (
                        <Typography variant="caption" color="text.secondary">
                          Qty: {ret.returnQuantity}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontSize="0.7rem">
                        {ret.returnReason || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ret.returnStatus || 'Unknown'} 
                        color={getStatusColor(ret.returnStatus)}
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {ret.refundAmount?.value 
                          ? `${ret.refundAmount.currency} ${ret.refundAmount.value}` 
                          : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontSize="0.75rem">
                        {formatDate(ret.creationDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        fontSize="0.75rem"
                        color={ret.responseDate && new Date(ret.responseDate) < new Date() ? 'error' : 'inherit'}
                      >
                        {formatDate(ret.responseDate)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
