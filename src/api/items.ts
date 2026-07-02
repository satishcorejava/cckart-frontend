import client from './client';
import type { ApiResponse, Item, ItemDetail, PagedResult } from '../types';

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

export const fetchItemDetail = async (id: string): Promise<ItemDetail> => {
  const res = await client.get<ApiResponse<ItemDetail>>(`/items/${id}`);
  return res.data.data;
};

export const updateItem = async (
  id: string,
  payload: { name: string; rate: number; purchase_rate: number },
): Promise<ItemDetail> => {
  const res = await client.put<ApiResponse<ItemDetail>>(`/items/${id}`, payload);
  return res.data.data;
};
