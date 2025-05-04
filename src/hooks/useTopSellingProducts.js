import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../context/DatabaseContext';

const useTopSellingProducts = (startDate, endDate, sortBy = 'revenue', limit = 10, period = 'custom') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { dashboard } = useDatabase();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert date objects to ISO strings for IPC transport only if they exist
      let startDateStr = startDate ? startDate.toISOString() : null;
      let endDateStr = endDate ? endDate.toISOString() : null;
      
      if (!startDate || !endDate) {
        console.warn('Date range is incomplete, report may not show correct data');
      }
      
      console.log(`Fetching top selling products with dates: ${startDateStr} to ${endDateStr}`);
      
      // Call the API with the custom date range
      const productsData = await dashboard.getTopSellingProducts(
        period,
        limit,
        sortBy,
        startDateStr,
        endDateStr
      );
      
      if (productsData && productsData.length > 0) {
        // Process the data to ensure it has all required fields - consistent with TopProductsChart
        const processedData = productsData.map(product => ({
          ...product,
          // Calculate profit margin if not provided
          profitMargin: product.profitMargin || 
            Math.round((product.profit / product.revenue) * 100) || 0
        }));
        
        setData(processedData);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching top selling products:', err);
      setError(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [dashboard, startDate, endDate, sortBy, limit, period]);

  // Fetch data when dependencies change
  useEffect(() => {
    if (dashboard) {
      fetchData();
    }
  }, [dashboard, fetchData]);

  // Function to manually refresh data
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
};

export default useTopSellingProducts; 