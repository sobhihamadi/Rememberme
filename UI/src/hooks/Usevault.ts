import { useState, useCallback, useEffect } from 'react';
import {
  getVaultItems,
  getVaultItemById,
  createVaultItem,
  updateVaultItem,
  deleteVaultItem,
} from '../api/Api.vault';
import {
  VaultCategory,
  VaultItemType,
  type VaultItemResponse,
  type CreateVaultItemRequest,
  type UpdateVaultItemRequest,
} from '../types/Types.vault';
import { ApiException } from '../api/Api.client';

interface VaultState {
  items:   VaultItemResponse[];
  loading: boolean;
  error:   string | null;
}

interface UseVaultReturn extends VaultState {
  /** Fetch all items for the current context. Called automatically when context changes. */
  fetchItems:   (userId: string, category: VaultCategory, type: VaultItemType) => Promise<void>;
  /** Fetch a single item by id (decrypted content). */
  fetchById:    (id: string) => Promise<VaultItemResponse>;
  /** Create a new item and refresh the list. */
  addItem:      (payload: CreateVaultItemRequest) => Promise<void>;
  /** Update an existing item and refresh the list. */
  editItem:     (payload: UpdateVaultItemRequest) => Promise<void>;
  /** Delete an item and remove it from the local list. */
  removeItem:   (id: string) => Promise<void>;
  clearError:   () => void;
}

/**
 * useVault
 *
 * Manages vault item state for a given user / category / type context.
 * Pass `userId`, `category`, and `type` to the hook; it will auto-fetch
 * whenever any of those three values change.
 *
 * Example usage in a component:
 *
 *   const { items, loading, error, addItem, removeItem } = useVault(
 *     userId, VaultCategory.WORK, VaultItemType.PASSWORD
 *   );
 */
export function useVault(
  userId:   string | null,
  category: VaultCategory | null,
  type:     VaultItemType | null,
): UseVaultReturn {
  const [state, setState] = useState<VaultState>({
    items:   [],
    loading: false,
    error:   null,
  });

  const setLoading = () => setState((prev) => ({ ...prev, loading: true, error: null }));
  const setError   = (error: string) => setState((prev) => ({ ...prev, loading: false, error }));
  const clearError = useCallback(() => setState((prev) => ({ ...prev, error: null })), []);

  // ── Auto-fetch on context change ─────────────────────────────────────────

  useEffect(() => {
    if (!userId || !category || !type) return;
    fetchItems(userId, category, type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, category, type]);

  // ── fetchItems ────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async (
    uid: string,
    cat: VaultCategory,
    typ: VaultItemType,
  ) => {
    setLoading();
    try {
      const items = await getVaultItems(uid, cat, typ);
      setState({ items, loading: false, error: null });
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Failed to load vault items');
    }
  }, []);

  // ── fetchById ─────────────────────────────────────────────────────────────

  const fetchById = useCallback(async (id: string): Promise<VaultItemResponse> => {
    try {
      return await getVaultItemById(id);
    } catch (err) {
      const msg = err instanceof ApiException ? err.message : 'Failed to load item';
      setError(msg);
      throw err;
    }
  }, []);

  // ── addItem ───────────────────────────────────────────────────────────────

  const addItem = useCallback(async (payload: CreateVaultItemRequest) => {
    setLoading();
    try {
      const created = await createVaultItem(payload);
      setState((prev) => ({
        items:   [created, ...prev.items],
        loading: false,
        error:   null,
      }));
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Failed to create item');
      throw err;
    }
  }, []);

  // ── editItem ──────────────────────────────────────────────────────────────

  const editItem = useCallback(async (payload: UpdateVaultItemRequest) => {
    setLoading();
    try {
      await updateVaultItem(payload);
      // Re-fetch to get the server's updated state (including re-encrypted content)
      if (userId && category && type) {
        const items = await getVaultItems(userId, category, type);
        setState({ items, loading: false, error: null });
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Failed to update item');
      throw err;
    }
  }, [userId, category, type]);

  // ── removeItem ────────────────────────────────────────────────────────────

  const removeItem = useCallback(async (id: string) => {
    setLoading();
    try {
      await deleteVaultItem(id);
      setState((prev) => ({
        items:   prev.items.filter((i) => i.id !== id),
        loading: false,
        error:   null,
      }));
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Failed to delete item');
      throw err;
    }
  }, []);

  return {
    ...state,
    fetchItems,
    fetchById,
    addItem,
    editItem,
    removeItem,
    clearError,
  };
}