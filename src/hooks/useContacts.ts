import { useQuery } from '@tanstack/react-query';
import { fetchContacts } from '../api/contacts';

export const useContacts = (
  contactType?: string,
  status?: string,
  page = 1,
  perPage = 25,
) =>
  useQuery({
    queryKey: ['contacts', contactType, status, page, perPage],
    queryFn:  () => fetchContacts(contactType, status, page, perPage),
    staleTime: 5 * 60 * 1000,
  });
