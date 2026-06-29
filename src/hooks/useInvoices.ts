import { useQuery } from '@tanstack/react-query';
import { fetchAllInvoices } from '../api/invoices';

export const useInvoices = (
  status?: string,
  dateStart?: string,
  dateEnd?: string,
  page = 1,
  perPage = 25,
) =>
  useQuery({
    queryKey: ['invoices', status, dateStart, dateEnd, page, perPage],
    queryFn:  () => fetchAllInvoices(status, dateStart, dateEnd, page, perPage),
    staleTime: 5 * 60 * 1000,
  });
