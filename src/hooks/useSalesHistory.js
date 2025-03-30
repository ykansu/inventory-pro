import { useState, useEffect, useCallback } from 'react';
import { SaleService } from '../services/DatabaseService';
import { format, subDays } from 'date-fns';

const useSalesHistory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  
  // Get current date and year
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  // Default date range: last 30 days to current day, using current year
  const [dateRange, setDateRange] = useState({
    start: format(subDays(currentDate, 30), 'yyyy-MM-dd').replace(/^\d{4}/, currentYear.toString()),
    end: format(currentDate, 'yyyy-MM-dd').replace(/^\d{4}/, currentYear.toString())
  });
  
  const [paymentFilter, setPaymentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load sales data
  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const salesData = await SaleService.getSalesByDateRange(
        dateRange.start, 
        dateRange.end
      );
      
      // Sort sales by date in descending order (newest first)
      const sortedSales = salesData?.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      }) || [];

      setSales(sortedSales);
      applyFilters(sortedSales, paymentFilter, searchQuery);
    } catch (err) {
      console.error('Error loading sales:', err);
      setError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end, paymentFilter, searchQuery]);

  // Apply filters to sales data
  const applyFilters = useCallback((salesData, paymentMethod, query) => {
    let filtered = [...salesData];
    
    // Apply payment method filter
    if (paymentMethod) {
      filtered = filtered.filter(sale => sale.payment_method === paymentMethod);
    }
    
    // Apply search query on receipt number
    if (query.trim()) {
      filtered = filtered.filter(sale => 
        sale.receipt_number.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    setFilteredSales(filtered);
  }, []);

  // Update filters and reload data
  const updateFilters = useCallback(({ start, end, payment, query }) => {
    let updated = false;
    
    if (start !== undefined && end !== undefined) {
      setDateRange({ start, end });
      updated = true;
    }
    
    if (payment !== undefined) {
      setPaymentFilter(payment);
      updated = true;
    }
    
    if (query !== undefined) {
      setSearchQuery(query);
      updated = true;
    }
    
    // Don't reload here, useEffect will handle it when dependencies change
  }, []);

  // Initial load and when filters change
  useEffect(() => {
    loadSales();
  }, [loadSales]);

  return {
    sales: filteredSales,
    loading,
    error,
    dateRange,
    paymentFilter,
    searchQuery,
    updateFilters,
    refresh: loadSales
  };
};

export default useSalesHistory; 