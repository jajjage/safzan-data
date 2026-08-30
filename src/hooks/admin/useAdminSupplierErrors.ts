"use client";

import { adminSupplierErrorsService } from "@/services/admin/supplierErrors.service";
import { SupplierErrorsQueryParams } from "@/types/admin/supplierErrors.types";
import { useQuery } from "@tanstack/react-query";

export function useAdminSupplierErrors(params?: SupplierErrorsQueryParams) {
  return useQuery({
    queryKey: ["admin", "supplier-errors", params],
    queryFn: () =>
      adminSupplierErrorsService.getLogs(params).then((res) => res.data),
  });
}

export function useAdminSupplierErrorStats(params?: {
  fromDate?: string;
  toDate?: string;
}) {
  return useQuery({
    queryKey: ["admin", "supplier-errors", "stats", params],
    queryFn: () =>
      adminSupplierErrorsService.getStats(params).then((res) => res.data),
  });
}
