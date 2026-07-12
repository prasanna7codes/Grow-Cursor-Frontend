import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RefreshIcon from '@mui/icons-material/Refresh';
import TokenIcon from '@mui/icons-material/Token';
import api from '../../lib/api';

const numberFmt = new Intl.NumberFormat('en-US');

function getDefaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().slice(0, 10);
}

function getDefaultEndDate() {
  return new Date().toISOString().slice(0, 10);
}

function toDateTimeLocal(dateValue, timeValue = '00:00') {
  return `${dateValue}T${timeValue}`;
}

function toIsoDateTime(value) {
  return value ? new Date(value).toISOString() : undefined;
}

function formatNumber(value) {
  return numberFmt.format(value || 0);
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function findSelectedOption(options, id, allLabel) {
  if (!id || id === 'all') return { id: 'all', label: allLabel };
  return options.find((option) => option.id === id) || { id, label: id };
}

function UsageFilter({ label, allLabel, value, options, onChange, minWidth = 190 }) {
  const fullOptions = useMemo(() => [{ id: 'all', label: allLabel }, ...options], [allLabel, options]);
  return (
    <Autocomplete
      size="small"
      options={fullOptions}
      value={findSelectedOption(fullOptions, value, allLabel)}
      onChange={(_, option) => onChange(option?.id || 'all')}
      getOptionLabel={(option) => option?.label || ''}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Box>
            <Typography variant="body2">{option.label}</Typography>
            {option.id !== 'all' && (
              <Typography variant="caption" color="text.secondary">
                {formatNumber(option.count)} calls
              </Typography>
            )}
          </Box>
        </li>
      )}
      renderInput={(params) => <TextField {...params} label={label} />}
      sx={{ minWidth }}
    />
  );
}

export default function PrecheckAiUsagePage() {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [filterOptions, setFilterOptions] = useState({ users: [], sellers: [], templates: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [endDate, setEndDate] = useState(getDefaultEndDate);
  const [singleDate, setSingleDate] = useState(getDefaultEndDate);
  const [startDateTime, setStartDateTime] = useState(() => toDateTimeLocal(getDefaultStartDate()));
  const [endDateTime, setEndDateTime] = useState(() => toDateTimeLocal(getDefaultEndDate(), '23:59'));
  const [singleDateTime, setSingleDateTime] = useState(() => toDateTimeLocal(getDefaultEndDate()));
  const [dateMode, setDateMode] = useState('single');
  const [timeFilterEnabled, setTimeFilterEnabled] = useState(false);
  const [userFilter, setUserFilter] = useState('all');
  const [sellerFilter, setSellerFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');

  const fetchUsage = async (overrides = {}) => {
    try {
      setLoading(true);
      setError('');
      const activeDateMode = overrides.dateMode ?? dateMode;
      const activeStartDate = overrides.startDate ?? startDate;
      const activeEndDate = overrides.endDate ?? endDate;
      const activeSingleDate = overrides.singleDate ?? singleDate;
      const activeStartDateTime = overrides.startDateTime ?? startDateTime;
      const activeEndDateTime = overrides.endDateTime ?? endDateTime;
      const activeSingleDateTime = overrides.singleDateTime ?? singleDateTime;
      const activeTimeFilterEnabled = overrides.timeFilterEnabled ?? timeFilterEnabled;
      const selectedStartDate = activeDateMode === 'single' ? activeSingleDate : activeStartDate;
      const selectedEndDate = activeDateMode === 'single' ? activeSingleDate : activeEndDate;
      const params = {
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        userId: overrides.userFilter ?? userFilter,
        sellerId: overrides.sellerFilter ?? sellerFilter,
        templateId: overrides.templateFilter ?? templateFilter
      };
      if (activeTimeFilterEnabled) {
        params.startDate = undefined;
        params.endDate = undefined;
        params.startDateTime = activeDateMode === 'single'
          ? toIsoDateTime(activeSingleDateTime)
          : toIsoDateTime(activeStartDateTime);
        params.endDateTime = activeDateMode === 'single'
          ? undefined
          : toIsoDateTime(activeEndDateTime);
      }
      const { data } = await api.get('/template-listings/api/precheck-usage-summary', { params });
      setRows(data.rows || []);
      setTotals(data.totals || {});
      setFilterOptions(data.filterOptions || { users: [], sellers: [], templates: [] });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch precheck AI usage');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    const defaultStartDate = getDefaultStartDate();
    const defaultEndDate = getDefaultEndDate();
    setDateMode('single');
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setSingleDate(defaultEndDate);
    setStartDateTime(toDateTimeLocal(defaultStartDate));
    setEndDateTime(toDateTimeLocal(defaultEndDate, '23:59'));
    setSingleDateTime(toDateTimeLocal(defaultEndDate));
    setTimeFilterEnabled(false);
    setUserFilter('all');
    setSellerFilter('all');
    setTemplateFilter('all');
    fetchUsage({
      dateMode: 'single',
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      singleDate: defaultEndDate,
      startDateTime: toDateTimeLocal(defaultStartDate),
      endDateTime: toDateTimeLocal(defaultEndDate, '23:59'),
      singleDateTime: toDateTimeLocal(defaultEndDate),
      timeFilterEnabled: false,
      userFilter: 'all',
      sellerFilter: 'all',
      templateFilter: 'all'
    });
  };

  useEffect(() => {
    fetchUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metricCardSx = {
    flex: 1,
    minWidth: 190,
    border: '1px solid #e5e7eb',
    borderRadius: 2,
    boxShadow: '0 10px 22px rgba(15, 23, 42, 0.05)'
  };

  return (
    <Container maxWidth={false} sx={{ py: 2.5, px: { xs: 2, lg: 3 }, bgcolor: '#f6f8fb', minHeight: '100vh' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="primary" /> ASIN Precheck AI Usage
        </Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchUsage} disabled={loading}>
          Refresh
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)' }}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={dateMode}
            onChange={(_, value) => {
              if (value) setDateMode(value);
            }}
            aria-label="Date filter mode"
          >
            <ToggleButton value="single">Single Date</ToggleButton>
            <ToggleButton value="range">Date Range</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={timeFilterEnabled ? 'time' : 'date'}
            onChange={(_, value) => {
              if (value) setTimeFilterEnabled(value === 'time');
            }}
            aria-label="Time filter mode"
          >
            <ToggleButton value="date">Date Only</ToggleButton>
            <ToggleButton value="time">Date + Time</ToggleButton>
          </ToggleButtonGroup>
          {dateMode === 'single' ? (
            timeFilterEnabled ? (
              <TextField
                label="Show After"
                type="datetime-local"
                size="small"
                value={singleDateTime}
                onChange={(e) => setSingleDateTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 220 }}
              />
            ) : (
              <TextField
                label="Date"
                type="date"
                size="small"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 160 }}
              />
            )
          ) : (
            <>
              {timeFilterEnabled ? (
                <>
                  <TextField
                    label="Start Date & Time"
                    type="datetime-local"
                    size="small"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 220 }}
                  />
                  <TextField
                    label="End Date & Time"
                    type="datetime-local"
                    size="small"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 220 }}
                  />
                </>
              ) : (
                <>
                  <TextField
                    label="Start Date"
                    type="date"
                    size="small"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 160 }}
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    size="small"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 160 }}
                  />
                </>
              )}
            </>
          )}
          <UsageFilter label="User" allLabel="All Users" value={userFilter} options={filterOptions.users || []} onChange={setUserFilter} />
          <UsageFilter label="Seller" allLabel="All Sellers" value={sellerFilter} options={filterOptions.sellers || []} onChange={setSellerFilter} />
          <UsageFilter label="Template" allLabel="All Templates" value={templateFilter} options={filterOptions.templates || []} onChange={setTemplateFilter} minWidth={220} />
          <Button variant="contained" onClick={fetchUsage} disabled={loading} startIcon={<CalendarMonthIcon />}>
            Apply
          </Button>
          <Button variant="outlined" onClick={clearFilters} disabled={loading}>
            Clear
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', rowGap: 2 }}>
        <Card sx={metricCardSx}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <TokenIcon fontSize="small" color="primary" />
              <Typography variant="caption" color="text.secondary">Total Tokens</Typography>
            </Stack>
            <Typography variant="h5" fontWeight={700}>{formatNumber(totals.totalTokens)}</Typography>
          </CardContent>
        </Card>
        <Card sx={metricCardSx}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">ASINs Checked</Typography>
            <Typography variant="h5" fontWeight={700}>{formatNumber(totals.asinCount)}</Typography>
          </CardContent>
        </Card>
        <Card sx={metricCardSx}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">Successful Calls</Typography>
            <Typography variant="h5" fontWeight={700} color="success.main">{formatNumber(totals.successfulCalls)}</Typography>
          </CardContent>
        </Card>
        <Card sx={metricCardSx}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">Failed Calls</Typography>
            <Typography variant="h5" fontWeight={700} color={totals.failedCalls ? 'error.main' : 'text.primary'}>
              {formatNumber(totals.failedCalls)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={metricCardSx}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">Total AI Calls</Typography>
            <Typography variant="h5" fontWeight={700}>{formatNumber(totals.aiCalls)}</Typography>
          </CardContent>
        </Card>
        <Card sx={metricCardSx}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">Users / Templates</Typography>
            <Typography variant="h5" fontWeight={700}>{formatNumber(totals.userCount)} / {formatNumber(totals.templateCount)}</Typography>
          </CardContent>
        </Card>
      </Stack>

      <Paper sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e5e7eb' }}>
          <Typography variant="subtitle1" fontWeight={600}>Usage By User, Seller, Template</Typography>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 640 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Seller</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell align="right">ASINs Checked</TableCell>
                  <TableCell align="right">AI Calls</TableCell>
                  <TableCell align="right">Successful</TableCell>
                  <TableCell align="right">Failed</TableCell>
                  <TableCell align="right">Total Tokens</TableCell>
                  <TableCell>First Used</TableCell>
                  <TableCell>Last Used</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No precheck AI usage found for the selected filters.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row, index) => (
                  <TableRow key={`${row.userId || 'u'}-${row.sellerId || 's'}-${row.templateId || 't'}-${index}`} hover>
                    <TableCell>
                      <Typography variant="body2">{row.username}</Typography>
                      {row.userEmail && (
                        <Typography variant="caption" color="text.secondary">{row.userEmail}</Typography>
                      )}
                    </TableCell>
                    <TableCell>{row.sellerName}</TableCell>
                    <TableCell>{row.templateName}</TableCell>
                    <TableCell align="right">{formatNumber(row.asinCount)}</TableCell>
                    <TableCell align="right">{formatNumber(row.aiCalls)}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>{formatNumber(row.successfulCalls)}</TableCell>
                    <TableCell align="right" sx={{ color: row.failedCalls ? 'error.main' : 'text.primary' }}>
                      {formatNumber(row.failedCalls)}
                    </TableCell>
                    <TableCell align="right">{formatNumber(row.totalTokens)}</TableCell>
                    <TableCell>{formatDateTime(row.firstUsedAt)}</TableCell>
                    <TableCell>{formatDateTime(row.lastUsedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
}
