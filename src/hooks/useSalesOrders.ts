import { useQuery } from '@tanstack/react-query';
import { fetchSalesOrders } from '../api/salesorders';

export const useSalesOrders = (
  status?: string,
  dateStart?: string,
  dateEnd?: string,
  page = 1,
  perPage = 25,
) =>
  useQuery({
    queryKey: ['salesorders', status, dateStart, dateEnd, page, perPage],
    queryFn:  () => fetchSalesOrders(status, dateStart, dateEnd, page, perPage),
    staleTime: 5 * 60 * 1000,
  });
