import client from './client';
import type { ApiResponse } from '../types';

export interface PaymentPayload {
  customer_id: string;
  payment_mode: string;
  amount: number;
  date: string;
  reference_number?: string;
  description?: string;
  invoices: { invoice_id: string; amount_applied: number }[];
}

export interface PaymentResult {
  payment_id: string;
  payment_number: string;
  amount: number;
}

export const recordPayment = async (payload: PaymentPayload): Promise<PaymentResult> => {
  const res = await client.post<ApiResponse<PaymentResult>>('/payments', payload);
  return res.data.data;
};
