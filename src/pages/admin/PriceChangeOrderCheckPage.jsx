import React, { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../lib/api';
import usePageAccess from '../../hooks/usePageAccess';

const defaultFilters = {
  legacyItemId: '',
  orderId: '',
  userId: '',
  sellerId: '',
  startDate: null,
  endDate: null,
  matchStatus: 'matched'
};

const PriceChangeOrderCheckPage = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const { hasAccess } = usePageAccess(user);

  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [error, setError] = useState('');
  const [copiedText, setCopiedText] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0
  });

  const fetchRows = async (page = 1, customFilters = filters, customLimit = pagination.limit) => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page,
        limit: customLimit,
        legacyItemId: customFilters.legacyItemId,
        orderId: customFilters.orderId,
        userId: customFilters.userId,
        sellerId: customFilters.sellerId,
        startDate: customFilters.startDate ? customFilters.startDate.toISOString() : undefined,
        endDate: customFilters.endDate ? customFilters.endDate.toISOString() : undefined,
        matchedOnly: customFilters.matchStatus === 'matched' ? 'true' : undefined,
        unmatchedOnly: customFilters.matchStatus === 'unmatched' ? 'true' : undefined
      };

      Object.keys(params).forEach((key) => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });

      const response = await api.get('/price-change-logs/order-checks', { params });
      setRows(response.data.rows || []);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Error fetching price change order checks:', err);
      setError(err.response?.data?.error || 'Failed to fetch price change order checks');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersAndSellers = async () => {
    setLoadingFilters(true);
    try {
      const [usersRes, sellersRes] = await Promise.all([
        api.get('/users'),
        api.get('/sellers/all')
      ]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setSellers(Array.isArray(sellersRes.data) ? sellersRes.data : []);
    } catch (err) {
      console.error('Error fetching users/sellers:', err);
    } finally {
      setLoadingFilters(false);
    }
  };

  useEffect(() => {
    fetchRows();
    fetchUsersAndSellers();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    fetchRows(1, filters, pagination.limit);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    fetchRows(1, defaultFilters, pagination.limit);
  };

  const handlePageChange = (event, newPage) => {
    fetchRows(newPage + 1, filters, pagination.limit);
  };

  const handleRowsPerPageChange = (event) => {
    const nextLimit = parseInt(event.target.value, 10);
    setPagination((prev) => ({ ...prev, limit: nextLimit }));
    fetchRows(1, filters, nextLimit);
  };

  const handleCopy = (text) => {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(''), 1200);
    }
  };

  const formatCurrency = (value) => {
    const numericValue = Number(value || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue);
  };

  const formatUtcDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short'
    }).format(new Date(dateString));
  };

  const formatIstDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
      timeZoneName: 'short'
    }).format(new Date(dateString));
  };

  const exportToCSV = () => {
    const headers = [
      'Changed At (IST)',
      'Username',
      'Seller',
      'Legacy Item ID',
      'Changed From Order ID',
      'Original Price',
      'New Price',
      'Difference',
      'Matched Orders After Change',
      'First Matched Order ID',
      'First Matched Order Date (UTC)',
      'Latest Matched Order ID',
      'Latest Matched Order Date (IST)',
      'Product Title'
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => ([
        formatIstDate(row.createdAt),
        row.user?.username || 'N/A',
        row.seller?.user?.username || 'N/A',
        row.legacyItemId || 'N/A',
        row.orderId || 'N/A',
        row.originalPrice ?? '',
        row.newPrice ?? '',
        row.priceDifference ?? '',
        row.matchedOrderCount ?? 0,
        row.firstMatchedOrder?.orderId || 'N/A',
        formatUtcDate(row.firstMatchedOrder?.orderDate),
        row.latestMatchedOrder?.orderId || 'N/A',
        formatIstDate(row.latestMatchedOrder?.orderDate),
        row.productTitle || 'N/A'
      ]).map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `price_change_order_check_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (!hasAccess('PriceChangeOrderCheck')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You do not have permission to view this page.</Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Price Change Order Check
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          This page only includes successful price changes from the All Orders Sheet. The comparison checks whether an order with the same legacy item id was created after the price change time using stored UTC timestamps, while Changed At and Latest Match are displayed in IST.
        </Alert>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                fullWidth
                size="small"
                options={users}
                getOptionLabel={(option) => option.username || ''}
                value={users.find((entry) => entry._id === filters.userId) || null}
                onChange={(event, newValue) => handleFilterChange('userId', newValue?._id || '')}
                loading={loadingFilters}
                renderInput={(params) => <TextField {...params} label="Username" />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                fullWidth
                size="small"
                options={sellers}
                getOptionLabel={(option) => option.user?.username || ''}
                value={sellers.find((entry) => entry._id === filters.sellerId) || null}
                onChange={(event, newValue) => handleFilterChange('sellerId', newValue?._id || '')}
                loading={loadingFilters}
                renderInput={(params) => <TextField {...params} label="Seller" />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Legacy Item ID"
                value={filters.legacyItemId}
                onChange={(event) => handleFilterChange('legacyItemId', event.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Changed From Order ID"
                value={filters.orderId}
                onChange={(event) => handleFilterChange('orderId', event.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Start Change Date"
                value={filters.startDate}
                onChange={(value) => handleFilterChange('startDate', value)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="End Change Date"
                value={filters.endDate}
                onChange={(value) => handleFilterChange('endDate', value)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Match Status</InputLabel>
                <Select
                  value={filters.matchStatus}
                  label="Match Status"
                  onChange={(event) => handleFilterChange('matchStatus', event.target.value)}
                >
                  <MenuItem value="matched">Matched Only</MenuItem>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="unmatched">Unmatched Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
            <Button variant="outlined" onClick={handleClearFilters}>
              Clear Filters
            </Button>
            <Button variant="outlined" onClick={exportToCSV} disabled={rows.length === 0}>
              Export to CSV
            </Button>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Paper>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Changed At (IST)</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Seller</TableCell>
                      <TableCell>Legacy Item ID</TableCell>
                      <TableCell>Price Change</TableCell>
                      <TableCell>Changed From Order</TableCell>
                      <TableCell>Matched Orders After Change</TableCell>
                      <TableCell>First Match</TableCell>
                      <TableCell>Latest Match</TableCell>
                      <TableCell>Product</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} align="center">
                          No matching price change records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => (
                        <TableRow key={row._id} hover>
                          <TableCell>{formatIstDate(row.createdAt)}</TableCell>
                          <TableCell>{row.user?.username || 'N/A'}</TableCell>
                          <TableCell>{row.seller?.user?.username || 'N/A'}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Chip
                                label={row.legacyItemId}
                                size="small"
                                color="primary"
                                component="a"
                                href={`https://www.ebay.com/itm/${row.legacyItemId}`}
                                target="_blank"
                                clickable
                                sx={{ cursor: 'pointer' }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => handleCopy(row.legacyItemId)}
                                aria-label="copy legacy item id"
                              >
                                <ContentCopyIcon sx={{ fontSize: '0.875rem' }} />
                              </IconButton>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.25}>
                              <Typography variant="body2">{formatCurrency(row.originalPrice)} to {formatCurrency(row.newPrice)}</Typography>
                              <Typography variant="caption" color={row.priceDifference >= 0 ? 'success.main' : 'error.main'}>
                                {row.priceDifference >= 0 ? '+' : ''}{formatCurrency(row.priceDifference)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{row.orderId || 'N/A'}</TableCell>
                          <TableCell>
                            <Stack spacing={0.75}>
                              <Chip
                                label={`${row.matchedOrderCount || 0} order${row.matchedOrderCount === 1 ? '' : 's'}`}
                                size="small"
                                color={row.matchedOrderCount > 0 ? 'success' : 'default'}
                                sx={{ width: 'fit-content' }}
                              />
                              {Array.isArray(row.matchedOrdersPreview) && row.matchedOrdersPreview.length > 0 && (
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                  {row.matchedOrdersPreview.map((order) => (
                                    <Chip
                                      key={order._id}
                                      label={order.orderId}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))}
                                </Stack>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            {row.firstMatchedOrder ? (
                              <Stack spacing={0.25}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Typography variant="body2">{row.firstMatchedOrder.orderId}</Typography>
                                  <Tooltip title="Open All Orders page">
                                    <IconButton
                                      size="small"
                                      component="a"
                                      href={`/admin/all-orders-sheet?search=${encodeURIComponent(row.firstMatchedOrder.orderId)}`}
                                      target="_blank"
                                    >
                                      <OpenInNewIcon sx={{ fontSize: '0.875rem' }} />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                  {formatUtcDate(row.firstMatchedOrder.orderDate)}
                                </Typography>
                              </Stack>
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {row.latestMatchedOrder ? (
                              <Stack spacing={0.25}>
                                <Typography variant="body2">{row.latestMatchedOrder.orderId}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatIstDate(row.latestMatchedOrder.orderDate)}
                                </Typography>
                              </Stack>
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={row.productTitle || 'N/A'} arrow placement="top-start">
                              <Typography
                                variant="body2"
                                sx={{
                                  maxWidth: 240,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {row.productTitle || 'N/A'}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[25, 50, 100]}
                component="div"
                count={pagination.total}
                rowsPerPage={pagination.limit}
                page={pagination.page - 1}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </>
          )}
        </Paper>

        <Snackbar
          open={!!copiedText}
          autoHideDuration={1200}
          onClose={() => setCopiedText('')}
          message={`Copied: ${copiedText}`}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default PriceChangeOrderCheckPage;