import client from './client';
import type { ApiResponse, DashboardSummary } from '../types';

export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  const res = await client.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
  return res.data.data;
};

export interface WeeklyCollectionDay {
  date: string;
  day: string;
  amount: number;
}

export const fetchWeeklyCollections = async (): Promise<WeeklyCollectionDay[]> => {
  const res = await client.get<ApiResponse<WeeklyCollectionDay[]>>('/dashboard/weekly-collections');
  return res.data.data;
};
