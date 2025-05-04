import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { startOfDay, endOfDay } from 'date-fns';

const useCategoryProfits = (startDate, endDate) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { dashboard } = useDatabase();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Ensure we have proper date objects and adjust them to start/end of day
      let formattedStartDate = startDate ? startOfDay(startDate) : null;
      let formattedEndDate = endDate ? endOfDay(endDate) : null;
      
      // Convert to ISO strings for IPC transport
      let startDateStr = formattedStartDate ? formattedStartDate.toISOString() : null;
      let endDateStr = formattedEndDate ? formattedEndDate.toISOString() : null;
      
      if (!startDate || !endDate) {
        // Handle incomplete date range silently
      }
      
      // Call the API
      const categoryData = await dashboard.getCategoryProfits(
        'custom', // Use custom period so we can apply our date range
        startDateStr,
        endDateStr
      );
      
      if (categoryData && categoryData.length > 0) {
        setData(categoryData);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching category profits:', err);
      setError(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [dashboard, startDate, endDate]);

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

export default useCategoryProfits; 