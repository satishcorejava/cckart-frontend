import client from './client';
import type { ApiResponse } from '../types';

export interface UpiSessionResponse {
  session_id:  string;
  qr_image:    string;   // data:image/png;base64,...
  upi_string:  string;
  expires_in:  number;   // seconds
}

export interface UpiPaymentStatus {
  status:                       string;   // initiated|incomplete|succeeded|failed|canceled
  payment_id:                   string | null;
  amount:                       number;
  upi_id:                       string | null;
  transaction_reference_number: string | null;
}

export const createUpiSession = async (params: {
  invoice_id:     string;
  invoice_number: string;
  customer_id:    string;
  amount:         number;
}): Promise<UpiSessionResponse> => {
  const res = await client.post<ApiResponse<UpiSessionResponse>>('/create-payment-session', params);
  return res.data.data;
};

export const fetchUpiPaymentStatus = async (sessionId: string): Promise<UpiPaymentStatus> => {
  const res = await client.get<ApiResponse<UpiPaymentStatus>>(`/payment-status/${sessionId}`);
  return res.data.data;
};

export const recordUpiPayment = async (params: {
  invoice_id:                   string;
  amount:                       number;
  upi_id:                       string | null;
  transaction_reference_number: string | null;
}): Promise<void> => {
  await client.post('/record-payment', params);
};
