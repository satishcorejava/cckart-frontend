import client from './client';
import type { ApiResponse, Item, PagedResult } from '../types';

export const fetchItems = async (
  status?: string,
  search?: string,
  page = 1,
  perPage = 25,
): Promise<PagedResult<Item>> => {
  const res = await client.get<ApiResponse<PagedResult<Item>>>('/items', {
    params: { status, search, page, perPage },
  });
  return res.data.data;
};
