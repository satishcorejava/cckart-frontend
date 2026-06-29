import client from './client';
import type { ApiResponse, Contact, PagedResult } from '../types';

export const fetchContacts = async (
  contactType?: string,
  status?: string,
  page = 1,
  perPage = 25,
): Promise<PagedResult<Contact>> => {
  const res = await client.get<ApiResponse<PagedResult<Contact>>>('/contacts', {
    params: { contactType, status, page, perPage },
  });
  return res.data.data;
};

export const deleteContact = async (id: string): Promise<void> => {
  await client.delete(`/contacts/${id}`);
};
