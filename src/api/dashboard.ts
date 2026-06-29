import client from './client';
import type { ApiResponse, DashboardSummary } from '../types';

export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  const res = await client.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
  return res.data.data;
};
