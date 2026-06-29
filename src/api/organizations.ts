import client from './client';
import type { ApiResponse } from '../types';

export interface Organization {
  organization_id: string;
  name: string;
  contact_name: string;
  email: string;
  currency_code: string;
  time_zone: string;
  is_default_org: boolean;
}

export const fetchOrganizations = async (): Promise<Organization[]> => {
  const res = await client.get<ApiResponse<Organization[]>>('/organizations');
  return res.data.data ?? [];
};

