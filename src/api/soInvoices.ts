import client from './client';
import type { ApiResponse, SalesOrder, PagedResult } from '../types';

export interface LinkedInvoice {
  invoice_id: string;
  invoice_number: string;
  status: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  invoice_url: string;
}

export const fetchSOInvoices = async (salesOrderId: string): Promise<LinkedInvoice[]> => {
  const res = await client.get<ApiResponse<LinkedInvoice[]>>(`/salesorders/${salesOrderId}/invoices`);
  return res.data.data;
};

export const fetchSalesOrdersForLookup = async (
  dateStart?: string,
  dateEnd?: string,
  page = 1,
  perPage = 20,
): Promise<PagedResult<SalesOrder>> => {
  const res = await client.get<ApiResponse<PagedResult<SalesOrder>>>('/salesorders', {
    params: { dateStart, dateEnd, page, perPage },
  });
  return res.data.data;
};
