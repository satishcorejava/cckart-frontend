import { useQuery } from '@tanstack/react-query';
import { fetchDashboardSummary } from '../api/dashboard';

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn:  fetchDashboardSummary,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
