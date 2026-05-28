import { client } from './Api.client';
import {
  VaultCategory,
  VaultItemType,
  type VaultItemResponse,
  type CreateVaultItemRequest,
  type UpdateVaultItemRequest,
} from '../types/Types.vault';

/**
 * GET /api/v1/vault?userId=&category=&type=
 * Retrieves all vault items for a user filtered by category + type.
 */
export async function getVaultItems(
  userId:   string,
  category: VaultCategory,
  type:     VaultItemType,
): Promise<VaultItemResponse[]> {
  const params = new URLSearchParams({ userId, category, type });
  return client.get<VaultItemResponse[]>(`/vault?${params.toString()}`);
}

/**
 * GET /api/v1/vault/:id
 * Fetches and decrypts a single vault item.
 */
export async function getVaultItemById(id: string): Promise<VaultItemResponse> {
  return client.get<VaultItemResponse>(`/vault/${id}`);
}

/**
 * POST /api/v1/vault
 * Creates a new vault item. The service layer encrypts the content.
 */
export async function createVaultItem(
  payload: CreateVaultItemRequest,
): Promise<VaultItemResponse> {
  return client.post<VaultItemResponse>('/vault', payload);
}

/**
 * PUT /api/v1/vault/:id
 * Updates an existing vault item, re-encrypting content if changed.
 */
export async function updateVaultItem(
  payload: UpdateVaultItemRequest,
): Promise<{ message: string }> {
  const { id, ...body } = payload;
  return client.put<{ message: string }>(`/vault/${id}`, body);
}

/**
 * DELETE /api/v1/vault/:id
 * Permanently removes a vault item.
 */
export async function deleteVaultItem(id: string): Promise<{ message: string }> {
  return client.delete<{ message: string }>(`/vault/${id}`);
}