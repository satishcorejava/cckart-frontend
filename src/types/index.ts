export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}

export interface Invoice {
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  customer_id: string;
  status: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  currency_code: string;
}

export interface SalesOrder {
  salesorder_id: string;
  salesorder_number: string;
  customer_name: string;
  customer_id: string;
  status: string;
  date: string;
  shipment_date: string;
  total: number;
  bcy_total: number;
  currency_code: string;
  reference_number: string;
}

export interface Contact {
  contact_id: string;
  contact_name: string;
  company_name: string;
  contact_type: string;
  status: string;
  email: string;
  phone: string;
  currency_code: string;
  outstanding_receivable_amount: number;
  outstanding_payable_amount: number;
}

export interface Item {
  item_id: string;
  name: string;
  sku: string;
  item_type: string;
  description: string;
  rate: number;
  purchase_rate: number;
  status: string;
  unit: string;
  stock_on_hand: number;
  tax_name: string;
  hsn_or_sac: string;
}

export interface InvoiceLineItem {
  line_item_id: string;
  item_id: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  unit: string;
  amount: number;
  tax_name: string;
  tax_percentage: number;
}

export interface BillingAddress {
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export interface InvoiceDetail extends Invoice {
  reference_number: string;
  notes: string;
  terms: string;
  mobile: string;
  phone: string;
  invoice_url: string;
  billing_address: BillingAddress;
  line_items: InvoiceLineItem[];
}

export interface DashboardSummary {
  unpaidInvoiceCount: number;
  unpaidInvoiceTotal: number;
  overdueInvoiceCount: number;
  overdueInvoiceTotal: number;
  openSalesOrderCount: number;
  openSalesOrderTotal: number;
  collectedYtd: number;
  collectionRate: number;
}
