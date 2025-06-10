import { useState, useEffect } from 'react';
import { healthApi } from '@/services/api';

export const useHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await healthApi.getHealth();
      setHealth(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch health status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    
    // Poll health status every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    health,
    loading,
    error,
    refetch: fetchHealth,
    isHealthy: health?.status === 'healthy',
    isUnhealthy: health?.status === 'unhealthy'
  };
};

