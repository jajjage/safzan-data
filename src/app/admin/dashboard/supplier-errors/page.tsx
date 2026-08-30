import { ErrorLogsTable } from "@/components/features/admin/supplier-errors/ErrorLogsTable";

export const metadata = {
  title: "Supplier Errors | Admin Dashboard",
  description: "View and diagnose supplier API errors and failure logs",
};

export default function AdminSupplierErrorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Supplier Error Logs
        </h1>
        <p className="text-muted-foreground text-sm">
          Diagnose supplier failures, timeouts, and resource availability across
          all connected providers.
        </p>
      </div>

      <ErrorLogsTable />
    </div>
  );
}
