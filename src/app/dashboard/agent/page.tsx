"use client";

import {
  BankWithdrawalHistory,
  BankWithdrawModal,
  WalletWithdrawModal,
  WithdrawalMethodSelector,
  WithdrawalStatusTracker,
} from "@/components/features/withdrawal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  useAgentAccount,
  useAgentStats,
  useActivateAgent,
} from "@/hooks/useAgent";
import { useActiveWithdrawalCount } from "@/hooks/useWithdrawal";
import { Copy, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function AgentPage() {
  const {
    data: account,
    error: accountError,
    isLoading: accountLoading,
  } = useAgentAccount();
  const {
    data: stats,
    error: statsError,
    isLoading: statsLoading,
  } = useAgentStats(Boolean(account));
  const activateAgent = useActivateAgent();
  const activeWithdrawalCount = useActiveWithdrawalCount();

  const [withdrawalMethod, setWithdrawalMethod] = useState<
    "wallet" | "bank" | null
  >(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  if (accountLoading || (Boolean(account) && statsLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (accountError || statsError) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-2xl font-bold">Agent Dashboard</h1>
          <Card>
            <CardHeader>
              <CardTitle>We couldn&apos;t load your agent dashboard</CardTitle>
              <CardDescription>Please refresh and try again.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="bg-muted/40 min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-4xl font-bold">Agent Dashboard</h1>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Activate agent mode</CardTitle>
              <CardDescription>
                Agent access is enabled for this tenant. Activate your account
                to generate your agent code and start tracking customers,
                commissions, and withdrawals.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => activateAgent.mutate()}
                disabled={activateAgent.isPending}
              >
                {activateAgent.isPending ? "Activating..." : "Activate Agent"}
              </Button>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(account.agentCode);
    toast.success("Agent code copied!");
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/register?agentCode=${account.agentCode}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied!");
  };

  const handleSelectWithdrawalMethod = (method: "wallet" | "bank") => {
    setWithdrawalMethod(method);
    if (method === "wallet") {
      setShowWalletModal(true);
    } else {
      setShowBankModal(true);
    }
  };

  return (
    <div className="bg-muted/40 min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-4xl font-bold">Agent Dashboard</h1>

        {/* Agent Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Agent Code</CardTitle>
            <CardDescription>
              Share this code with friends to earn commissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={account.agentCode}
                readOnly
                className="font-mono text-lg font-bold"
              />
              <Button size="icon" onClick={handleCopyCode} variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-2 md:flex-row">
              <Button
                onClick={handleShareLink}
                variant="secondary"
                className="flex-1"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Copy Share Link
              </Button>
            </div>

            <div className="text-muted-foreground text-sm">
              Status:{" "}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {account.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.totalCustomers ?? 0}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {stats?.activeCustomers ?? 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ₦{(stats?.totalCommissionsEarned ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Withdrawn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ₦{(stats?.withdrawnCommissionsAmount ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                ₦{(stats?.availableBalanceAmount ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link href="/dashboard/agent/customers">
            <Button variant="outline" className="h-12 w-full">
              View Customers
            </Button>
          </Link>
          <Link href="/dashboard/agent/commissions">
            <Button variant="outline" className="h-12 w-full">
              View Commissions
            </Button>
          </Link>
        </div>

        {/* Withdrawal Status Tracker */}
        <div className="mb-8">
          <WithdrawalStatusTracker />
        </div>

        {/* Withdraw Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Withdraw Commissions</CardTitle>
              {activeWithdrawalCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {activeWithdrawalCount} Active
                </Badge>
              )}
            </div>
            <CardDescription>
              Choose how you want to withdraw your available balance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <WithdrawalMethodSelector
              selectedMethod={withdrawalMethod}
              onSelectMethod={handleSelectWithdrawalMethod}
            />

            {!withdrawalMethod && (
              <p className="text-muted-foreground text-sm">
                Select a withdrawal method to continue
              </p>
            )}
          </CardContent>
        </Card>

        {/* Bank Withdrawal History */}
        {withdrawalMethod === "bank" && (
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>
                Track your bank withdrawal requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BankWithdrawalHistory />
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        <WalletWithdrawModal
          isOpen={showWalletModal}
          onClose={() => {
            setShowWalletModal(false);
            setWithdrawalMethod(null);
          }}
        />
        <BankWithdrawModal
          isOpen={showBankModal}
          onClose={() => {
            setShowBankModal(false);
            setWithdrawalMethod(null);
          }}
        />
      </div>
    </div>
  );
}
