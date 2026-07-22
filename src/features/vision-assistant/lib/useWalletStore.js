import { create } from 'zustand';
import { supabase } from '../../../shared/lib/supabaseClient';

const TABLE_NAME = 'vision_wallet_entries';

/**
 * useWalletStore - Zustand store for Vision Assistant Wallet Balance Tracker.
 * Supabase table `public.vision_wallet_entries` is the source of truth.
 * State includes balance (computed sum across full user history), recentEntries (most recent 50), isLoading, and error.
 */
export const useWalletStore = create((set, get) => ({
    balance: 0,
    recentEntries: [],
    isLoading: false,
    error: null,

    /**
     * Fetches current wallet balance and recent 50 entries from Supabase.
     * Computes full-history balance via lightweight client-side sum of select('amount') query.
     */
    fetchWalletData: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            // (a) Full-history balance query: lightweight select('amount') for user's full history
            let balanceQuery = supabase.from(TABLE_NAME).select('amount');
            if (userId) {
                balanceQuery = balanceQuery.eq('user_id', userId);
            }
            const { data: allAmounts, error: balanceError } = await balanceQuery;

            if (balanceError) {
                console.error('[WalletStore] Fetch balance error:', balanceError);
                set({ isLoading: false, error: "Couldn't load your wallet right now — check your connection and try again" });
                return;
            }

            const computedBalance = (allAmounts || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);

            // (b) Display query: 50 most recent entries ordered descending
            let recentQuery = supabase
                .from(TABLE_NAME)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            if (userId) {
                recentQuery = recentQuery.eq('user_id', userId);
            }
            const { data: entries, error: recentError } = await recentQuery;

            if (recentError) {
                console.error('[WalletStore] Fetch recent entries error:', recentError);
                set({ isLoading: false, error: "Couldn't load your wallet right now — check your connection and try again" });
                return;
            }

            set({
                balance: computedBalance,
                recentEntries: entries || [],
                isLoading: false,
                error: null,
            });
        } catch (err) {
            console.error('[WalletStore] Unexpected fetch error:', err);
            set({ isLoading: false, error: "Couldn't load your wallet right now — check your connection and try again" });
        }
    },

    /**
     * Inserts a positive credit entry and refreshes wallet data from server.
     */
    addToBalance: async (userId, amount, note) => {
        const numAmount = Math.abs(Number(amount) || 0);
        if (numAmount === 0) return { success: false, error: 'Invalid amount' };

        try {
            const payload = { amount: numAmount, note: note || 'Added money' };
            if (userId) payload.user_id = userId;

            const { error: insertError } = await supabase.from(TABLE_NAME).insert(payload);
            if (insertError) {
                console.error('[WalletStore] addToBalance error:', insertError);
                return { success: false, error: insertError.message };
            }

            await get().fetchWalletData(userId);
            return { success: true };
        } catch (err) {
            console.error('[WalletStore] Unexpected addToBalance error:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Inserts a negative debit entry. Caps debit at available balance if amount > balance.
     */
    subtractFromBalance: async (userId, amount, note) => {
        const requested = Math.abs(Number(amount) || 0);
        if (requested === 0) return { success: false, error: 'Invalid amount' };

        try {
            await get().fetchWalletData(userId);
            const currentBalance = get().balance;

            const available = Math.max(0, currentBalance);
            const actualDebit = Math.min(requested, available);

            if (actualDebit === 0) {
                return {
                    success: false,
                    error: 'Zero balance available to subtract',
                    actualDebit: 0,
                    available: 0,
                    requested,
                };
            }

            let finalNote = note || 'Spent money';
            if (requested > available) {
                finalNote = `${finalNote} (only ₹${actualDebit} was available)`;
            }

            const payload = { amount: -actualDebit, note: finalNote };
            if (userId) payload.user_id = userId;

            const { error: insertError } = await supabase.from(TABLE_NAME).insert(payload);
            if (insertError) {
                console.error('[WalletStore] subtractFromBalance error:', insertError);
                return { success: false, error: insertError.message };
            }

            await get().fetchWalletData(userId);
            return {
                success: true,
                actualDebit,
                requested,
                available,
                wasCapped: requested > available,
            };
        } catch (err) {
            console.error('[WalletStore] Unexpected subtractFromBalance error:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Deletes a single history row by id and refreshes wallet data.
     */
    removeHistoryEntry: async (userId, id) => {
        if (!id) return { success: false };
        try {
            let deleteQuery = supabase.from(TABLE_NAME).delete().eq('id', id);
            if (userId) {
                deleteQuery = deleteQuery.eq('user_id', userId);
            }
            const { error: deleteError } = await deleteQuery;
            if (deleteError) {
                console.error('[WalletStore] removeHistoryEntry error:', deleteError);
                return { success: false, error: deleteError.message };
            }

            await get().fetchWalletData(userId);
            return { success: true };
        } catch (err) {
            console.error('[WalletStore] Unexpected removeHistoryEntry error:', err);
            return { success: false, error: err.message };
        }
    },
}));
