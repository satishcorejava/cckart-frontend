import client from './client';
import type { ApiResponse, SalesOrder, SalesOrderDetail, PagedResult } from '../types';

export const fetchSalesOrderDetail = async (id: string): Promise<SalesOrderDetail> => {
  const res = await client.get<ApiResponse<SalesOrderDetail>>(`/salesorders/${id}`);
  return res.data.data;
};

export const fetchSalesOrders = async (
  status?: string,
  dateStart?: string,
  dateEnd?: string,
  page = 1,
  perPage = 25,
): Promise<PagedResult<SalesOrder>> => {
  const res = await client.get<ApiResponse<PagedResult<SalesOrder>>>('/salesorders', {
    params: { status, dateStart, dateEnd, page, perPage },
  });
  return res.data.data;
};

export interface FulfillRequest {
  payment_mode: string;
  amount: number;
  date: string;
  reference_number?: string;
  description?: string;
}

export interface FulfillmentResult {
  salesOrderId: string;
  salesOrderNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  paymentId: string;
  packageId: string;
  shipmentId: string;
  message: string;
}

export const fulfillSalesOrder = async (
  id: string,
  request: FulfillRequest,
): Promise<FulfillmentResult> => {
  const res = await client.post<ApiResponse<FulfillmentResult>>(
    `/salesorders/${id}/fulfill`,
    request,
  );
  return res.data.data;
};
