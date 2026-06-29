import { useQuery } from '@tanstack/react-query';
import { fetchItems } from '../api/items';

export const useItems = (status?: string, search?: string, page = 1, perPage = 25) =>
  useQuery({
    queryKey: ['items', status, search, page, perPage],
    queryFn:  () => fetchItems(status, search, page, perPage),
    staleTime: 5 * 60 * 1000,
  });
