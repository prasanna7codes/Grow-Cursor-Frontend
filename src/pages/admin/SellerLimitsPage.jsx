import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Chip
} from '@mui/material';
import api from '../../lib/api';

const SellerLimitsPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLimits();
    }, []);

    const fetchLimits = async () => {
        try {
            const response = await api.get('/seller-limits');
            setData(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch seller limits:', err);
            setError('Failed to fetch seller limits. Please try again later.');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Seller Limits
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="seller limits table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Seller Name</TableCell>
                            <TableCell align="right">Quantity Limit Remaining</TableCell>
                            <TableCell align="right">Amount Limit Remaining</TableCell>
                            <TableCell align="center">Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow
                                key={row.sellerId}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    {row.username}
                                </TableCell>
                                <TableCell align="right">
                                    {row.quantityLimitRemaining !== 'N/A' ? parseInt(row.quantityLimitRemaining).toLocaleString() : 'N/A'}
                                </TableCell>
                                <TableCell align="right">
                                    {row.amountLimitRemaining && row.amountLimitRemaining !== 'N/A' && row.amountCurrency
                                        ? `${new Intl.NumberFormat('en-US', { style: 'currency', currency: row.amountCurrency }).format(row.amountLimitRemaining)}`
                                        : 'N/A'}
                                </TableCell>
                                <TableCell align="center">
                                    <Chip
                                        label={row.status}
                                        color={row.status === 'Success' ? 'success' : 'error'}
                                        size="small"
                                    />
                                    {row.error && (
                                        <Typography variant="caption" display="block" color="error">
                                            {row.error}
                                        </Typography>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SellerLimitsPage;
