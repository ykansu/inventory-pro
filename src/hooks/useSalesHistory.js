import { useState, useEffect, useCallback } from 'react';
import { SaleService } from '../services/DatabaseService';
import { format, subDays } from 'date-fns';

const useSalesHistory = (initialPage = 1, initialPageSize = 10) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sales, setSales] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  
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

  // Load paginated sales data
  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare filters
      const filters = {
        paymentMethod: paymentFilter,
        query: searchQuery
      };
      
      // Fetch paginated data
      const result = await SaleService.getPaginatedSales(
        dateRange.start, 
        dateRange.end,
        currentPage,
        pageSize,
        filters
      );
      
      if (result.success === false) {
        throw new Error(result.error || 'Failed to load sales data');
      }
      
      setSales(result.sales || []);
      setTotalCount(result.totalCount || 0);
      setTotalPages(result.totalPages || 0);
    } catch (err) {
      console.error('Error loading sales:', err);
      setError('Failed to load sales data');
      setSales([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end, currentPage, pageSize, paymentFilter, searchQuery]);

  // Update filters and reload data
  const updateFilters = useCallback(({ start, end, payment, query, page, itemsPerPage }) => {
    if (start !== undefined && end !== undefined) {
      setDateRange({ start, end });
    }
    
    if (payment !== undefined) {
      setPaymentFilter(payment);
    }
    
    if (query !== undefined) {
      setSearchQuery(query);
    }
    
    if (page !== undefined) {
      setCurrentPage(page);
    }
    
    if (itemsPerPage !== undefined) {
      setPageSize(itemsPerPage);
    }
    
    // When filters change, reset to page 1
    if ((start !== undefined && end !== undefined) || 
        payment !== undefined || 
        query !== undefined) {
      setCurrentPage(1);
    }
    
    // Don't reload here, useEffect will handle it when dependencies change
  }, []);
  
  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  // Initial load and when filters change
  useEffect(() => {
    loadSales();
  }, [loadSales]);

  return {
    sales,
    loading,
    error,
    dateRange,
    paymentFilter,
    searchQuery,
    updateFilters,
    refresh: loadSales,
    pagination: {
      currentPage,
      pageSize,
      totalCount,
      totalPages,
      handlePageChange
    }
  };
};

export default useSalesHistory; 