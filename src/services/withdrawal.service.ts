import apiClient from "@/lib/api-client";
import type { ApiResponse } from "@/types/api.types";
import {
  AdminWithdrawalProcessPayload,
  AvailableBalanceResponse,
  BankWithdrawalRequest,
  BankWithdrawalRequestObject,
  BankWithdrawalsListResponse,
  WalletWithdrawalRequest,
  WalletWithdrawalResponse,
} from "@/types/withdrawal.types";

/**
 * User-facing withdrawal services
 */
export const withdrawalService = {
  /**
   * Get available balance for agent
   */
  getAvailableBalance: async (): Promise<
    ApiResponse<AvailableBalanceResponse>
  > => {
    const response = await apiClient.get<
      ApiResponse<{
        stats?: {
          availableBalance?: number;
          availableBalanceAmount?: number;
        };
      }>
    >("/dashboard/agent/commissions?limit=1");
    const stats = response.data.data?.stats;
    return {
      ...response.data,
      data: {
        availableBalance:
          stats?.availableBalance ?? stats?.availableBalanceAmount ?? 0,
        totalCommissions: 0,
        pendingWithdrawals: 0,
      },
    };
  },

  /**
   * Withdraw to wallet
   */
  withdrawToWallet: async (
    payload: WalletWithdrawalRequest
  ): Promise<ApiResponse<WalletWithdrawalResponse>> => {
    const response = await apiClient.post<
      ApiResponse<WalletWithdrawalResponse>
    >("/dashboard/agent/commissions/withdraw", payload);
    return response.data;
  },

  /**
   * Request bank withdrawal
   */
  requestBankWithdrawal: async (
    payload: BankWithdrawalRequest
  ): Promise<ApiResponse<BankWithdrawalRequestObject>> => {
    const response = await apiClient.post<
      ApiResponse<BankWithdrawalRequestObject>
    >("/dashboard/agent/bank-withdrawals", payload);
    return response.data;
  },

  /**
   * Get agent bank withdrawal history
   */
  getBankWithdrawals: async (
    page = 1,
    limit = 20,
    status?: string
  ): Promise<ApiResponse<BankWithdrawalsListResponse>> => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (status) params.set("status", status);

    const response = await apiClient.get<
      ApiResponse<BankWithdrawalsListResponse>
    >(`/dashboard/agent/bank-withdrawals?${params.toString()}`);
    const body = response.data as ApiResponse<any>;
    return {
      ...body,
      data: {
        requests: body.data?.requests || body.data?.items || [],
        pagination: body.data?.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 1,
        },
      },
    };
  },
};

/**
 * Admin-facing withdrawal services
 */
export const adminWithdrawalService = {
  /**
   * Get all agent bank withdrawals (admin view)
   */
  getBankWithdrawals: async (
    page = 1,
    limit = 20,
    status?: string,
    agentUserId?: string
  ): Promise<ApiResponse<BankWithdrawalsListResponse>> => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (status) params.set("status", status);
    if (agentUserId) params.set("agentUserId", agentUserId);

    const response = await apiClient.get<
      ApiResponse<BankWithdrawalsListResponse>
    >(`/dashboard/agents/bank-withdrawals?${params.toString()}`);
    const body = response.data as ApiResponse<any>;
    return {
      ...body,
      data: {
        requests: body.data?.requests || body.data?.items || [],
        pagination: body.data?.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 1,
        },
      },
    };
  },

  /**
   * Process agent bank withdrawal request
   */
  processWithdrawal: async (
    withdrawalRequestId: string,
    payload: AdminWithdrawalProcessPayload
  ): Promise<ApiResponse<BankWithdrawalRequestObject>> => {
    const response = await apiClient.patch<
      ApiResponse<BankWithdrawalRequestObject>
    >(`/dashboard/agents/bank-withdrawals/${withdrawalRequestId}`, payload);
    return response.data;
  },
};
