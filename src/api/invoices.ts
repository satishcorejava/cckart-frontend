import client from './client';
import type { ApiResponse, Invoice, InvoiceDetail, PagedResult } from '../types';

export const fetchAllInvoices = async (
  status?: string,
  dateStart?: string,
  dateEnd?: string,
  page = 1,
  perPage = 25,
): Promise<PagedResult<Invoice>> => {
  const res = await client.get<ApiResponse<PagedResult<Invoice>>>('/invoices', {
    params: { status, dateStart, dateEnd, page, perPage },
  });
  return res.data.data;
};

export const fetchInvoiceDetail = async (id: string): Promise<InvoiceDetail> => {
  const res = await client.get<ApiResponse<InvoiceDetail>>(`/invoices/${id}`);
  return res.data.data;
};

export const fetchInvoicePaymentUrl = async (id: string): Promise<string> => {
  const res = await client.get<ApiResponse<{ payment_url: string }>>(`/invoices/${id}/payment-url`);
  return res.data.data.payment_url;
};

export const markInvoiceAsSent = async (id: string): Promise<void> => {
  await client.post(`/invoices/${id}/mark_sent`);
};

export const deleteContact = async (id: string): Promise<void> => {
  await client.delete(`/contacts/${id}`);
};
