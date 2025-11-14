import { useEffect, useState, useMemo } from 'react';
import {
  Box, Button, FormControl, InputLabel, MenuItem, Select,
  Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Typography, TextField, Collapse, IconButton,
  Badge, Divider, Grid, OutlinedInput, Checkbox, ListItemText, Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import api from '../../lib/api.js';

const ITEM_HEIGHT = 44;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: { style: { maxHeight: ITEM_HEIGHT * 6 + ITEM_PADDING_TOP, width: 280 } },
};

const unique = (arr) => Array.from(new Set(arr.filter(Boolean)));

export default function ListingSheetPage() {
  const [allRows, setAllRows] = useState([]); // Store all data
  const [platforms, setPlatforms] = useState([]);
  const [stores, setStores] = useState([]);
  const [openFilters, setOpenFilters] = useState(false);
  const [filters, setFilters] = useState({
    platformId: '',
    storeId: '',
    marketplace: '',
    dateMode: 'none', // 'none', 'single', 'range'
    singleDate: '',
    startDate: '',
    endDate: '',
    category: [],
    subcategory: [],
    range: []
  });

  const marketplaces = [
    { value: '', label: 'All' },
    { value: 'EBAY_US', label: 'eBay US' },
    { value: 'EBAY_AUS', label: 'eBay Australia' },
    { value: 'EBAY_CANADA', label: 'eBay Canada' }
  ];

  const load = async () => {
    const [{ data: lp }] = await Promise.all([
      api.get('/platforms', { params: { type: 'listing' } })
    ]);
    setPlatforms(lp);
  };

  const fetchAllData = async () => {
    try {
      // Fetch all data without any filters
      const { data } = await api.get('/listing-completions/sheet');
      setAllRows(data);
    } catch (error) {
      console.error('Failed to fetch listing sheet data:', error);
    }
  };

  useEffect(() => {
    load();
    fetchAllData(); // Load all data on mount
  }, []);

  useEffect(() => {
    if (filters.platformId) {
      api
        .get('/stores', { params: { platformId: filters.platformId } })
        .then(({ data }) => setStores(data));
    } else {
      setStores([]);
      setFilters(prev => ({ ...prev, storeId: '' }));
    }
  }, [filters.platformId]);

  // Get unique values for all filters from allRows
  const allCategories = useMemo(() => unique(allRows.map(r => r.category)), [allRows]);
  const allSubcategories = useMemo(() => unique(allRows.map(r => r.subcategory)), [allRows]);
  const allRanges = useMemo(() => unique(allRows.map(r => r.range)), [allRows]);

  // Helper function to convert date to YYYY-MM-DD format
  const toYMD = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Apply ALL filters client-side
  const filteredRows = useMemo(() => {
    return allRows.filter(r => {
      // Platform filter
      if (filters.platformId) {
        const platformMatch = platforms.find(p => p._id === filters.platformId);
        if (platformMatch && r.platform !== platformMatch.name) return false;
      }
      
      // Store filter
      if (filters.storeId) {
        const storeMatch = stores.find(s => s._id === filters.storeId);
        if (storeMatch && r.store !== storeMatch.name) return false;
      }
      
      // Marketplace filter
      if (filters.marketplace && r.marketplace !== filters.marketplace) return false;
      
      // Date filter
      if (filters.dateMode === 'single' && filters.singleDate) {
        const rowDate = toYMD(r.date);
        if (rowDate !== filters.singleDate) return false;
      } else if (filters.dateMode === 'range') {
        const rowDate = toYMD(r.date);
        if (filters.startDate && rowDate < filters.startDate) return false;
        if (filters.endDate && rowDate > filters.endDate) return false;
      }
      
      // Category filter
      if (filters.category.length && !filters.category.includes(r.category)) return false;
      
      // Subcategory filter
      if (filters.subcategory.length && !filters.subcategory.includes(r.subcategory)) return false;
      
      // Range filter
      if (filters.range.length && !filters.range.includes(r.range)) return false;
      
      return true;
    });
  }, [allRows, filters, platforms, stores]);

  // Calculate total quantity
  const totalQuantity = useMemo(() => {
    return filteredRows.reduce((sum, row) => sum + (row.quantity || 0), 0);
  }, [filteredRows]);

  // Active filter count
  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.platformId) n++;
    if (filters.storeId) n++;
    if (filters.marketplace) n++;
    if (filters.dateMode !== 'none') n++;
    if (filters.category.length) n++;
    if (filters.subcategory.length) n++;
    if (filters.range.length) n++;
    return n;
  }, [filters]);

  const handleMultiChange = (key) => (e) => {
    const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
    setFilters(f => ({ ...f, [key]: value }));
  };

  const handleReset = () => {
    setFilters({
      platformId: '',
      storeId: '',
      marketplace: '',
      dateMode: 'none',
      singleDate: '',
      startDate: '',
      endDate: '',
      category: [],
      subcategory: [],
      range: []
    });
    // No need to fetch data - filters will automatically reset
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Listing Sheet</Typography>

      <Paper sx={{ p: 1.5, mb: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Badge color={activeCount ? 'primary' : 'default'} badgeContent={activeCount} overlap="circular">
              <IconButton 
                size="small" 
                onClick={() => setOpenFilters(!openFilters)}
                sx={{ 
                  transform: openFilters ? 'rotate(180deg)' : 'rotate(0)', 
                  transition: 'transform 0.2s' 
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            </Badge>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon fontSize="small" /> Listing Sheet Filters
            </Typography>
          </Stack>
          <Stack direction="row" gap={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ClearAllIcon />}
              onClick={handleReset}
              disabled={activeCount === 0}
            >
              Clear all
            </Button>
          </Stack>
        </Stack>

        <Collapse in={openFilters} timeout="auto">
          <Divider sx={{ my: 1.5 }} />
          <Grid container spacing={1.5} alignItems="center">
            {/* Platform */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Platform</InputLabel>
                <Select
                  label="Platform"
                  value={filters.platformId}
                  onChange={(e) => setFilters({ ...filters, platformId: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  {platforms.map((p) => (
                    <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Store */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small" disabled={!filters.platformId}>
                <InputLabel>Store</InputLabel>
                <Select
                  label="Store"
                  value={filters.storeId}
                  onChange={(e) => setFilters({ ...filters, storeId: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  {stores.map((s) => (
                    <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Marketplace */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Marketplace</InputLabel>
                <Select
                  label="Marketplace"
                  value={filters.marketplace}
                  onChange={(e) => setFilters({ ...filters, marketplace: e.target.value })}
                >
                  {marketplaces.map((m) => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Date Mode */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Filter</InputLabel>
                <Select
                  label="Date Filter"
                  value={filters.dateMode}
                  onChange={(e) => setFilters({ ...filters, dateMode: e.target.value })}
                >
                  <MenuItem value="none">No Date Filter</MenuItem>
                  <MenuItem value="single">Single Date</MenuItem>
                  <MenuItem value="range">Date Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Single Date */}
            {filters.dateMode === 'single' && (
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Date"
                  type="date"
                  value={filters.singleDate}
                  onChange={(e) => setFilters({ ...filters, singleDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}

            {/* Date Range */}
            {filters.dateMode === 'range' && (
              <>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Start Date"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="End Date"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}

            {/* Category */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  multiple
                  label="Category"
                  value={filters.category}
                  onChange={handleMultiChange('category')}
                  input={<OutlinedInput label="Category" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((v) => <Chip key={v} label={v} size="small" />)}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  {allCategories.map((name) => (
                    <MenuItem key={name} value={name}>
                      <Checkbox size="small" checked={filters.category.indexOf(name) > -1} />
                      <ListItemText primary={name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Subcategory */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Subcategory</InputLabel>
                <Select
                  multiple
                  label="Subcategory"
                  value={filters.subcategory}
                  onChange={handleMultiChange('subcategory')}
                  input={<OutlinedInput label="Subcategory" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((v) => <Chip key={v} label={v} size="small" />)}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  {allSubcategories.map((name) => (
                    <MenuItem key={name} value={name}>
                      <Checkbox size="small" checked={filters.subcategory.indexOf(name) > -1} />
                      <ListItemText primary={name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Range */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Range</InputLabel>
                <Select
                  multiple
                  label="Range"
                  value={filters.range}
                  onChange={handleMultiChange('range')}
                  input={<OutlinedInput label="Range" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((v) => <Chip key={v} label={v} size="small" />)}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  {allRanges.map((name) => (
                    <MenuItem key={name} value={name}>
                      <Checkbox size="small" checked={filters.range.indexOf(name) > -1} />
                      <ListItemText primary={name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {filteredRows.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Platform</strong></TableCell>
                <TableCell><strong>Store</strong></TableCell>
                <TableCell><strong>Marketplace</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell><strong>Subcategory</strong></TableCell>
                <TableCell><strong>Range</strong></TableCell>
                <TableCell align="right"><strong>Quantity</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                  <TableCell>{row.platform}</TableCell>
                  <TableCell>{row.store}</TableCell>
                  <TableCell>{row.marketplace?.replace('EBAY_', 'eBay ').replace('_', ' ')}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{row.subcategory}</TableCell>
                  <TableCell>{row.range}</TableCell>
                  <TableCell align="right">{row.quantity}</TableCell>
                </TableRow>
              ))}
              {/* Total Row */}
              <TableRow sx={{ backgroundColor: 'action.hover', fontWeight: 'bold' }}>
                <TableCell colSpan={7} align="right"><strong>Total</strong></TableCell>
                <TableCell align="right"><strong>{totalQuantity}</strong></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {filteredRows.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No data available.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
