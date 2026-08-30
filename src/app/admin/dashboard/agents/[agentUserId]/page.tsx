"use client";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAgentCommissionsAdmin,
  useAgentCustomersAdmin,
  useAgentDetails,
} from "@/hooks/useAgent";
import { ChevronLeft, Search } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

interface AgentDetailPageProps {
  params: Promise<{
    agentUserId: string;
  }>;
}

export default function AgentDetailPage({ params }: AgentDetailPageProps) {
  const [agentUserId, setAgentUserId] = useState<string>("");
  const [customerPage, setCustomerPage] = useState(1);
  const [commissionPage] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");

  const formatCurrency = (value: number | string | null | undefined) =>
    `₦${Number(value ?? 0).toLocaleString()}`;

  const formatCount = (value: number | string | null | undefined) =>
    Number(value ?? 0).toLocaleString();

  const formatDate = (value: string | null | undefined) => {
    if (!value) {
      return "N/A";
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "N/A" : parsed.toLocaleDateString();
  };

  React.useEffect(() => {
    params.then(({ agentUserId }) => setAgentUserId(agentUserId));
  }, [params]);

  const { data: agent, isLoading: agentLoading } = useAgentDetails(agentUserId);
  const { data: customersData, isLoading: customersLoading } =
    useAgentCustomersAdmin(agentUserId, customerPage, 10, customerSearch);
  const { data: commissionsData, isLoading: commissionsLoading } =
    useAgentCommissionsAdmin(agentUserId, commissionPage, 10);

  if (agentLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Agent Not Found</h1>
          <Link href="/admin/dashboard/agents">
            <Button>Back to Agents</Button>
          </Link>
        </div>
      </div>
    );
  }

  const customers = customersData?.data ?? [];
  const commissions = commissionsData?.data ?? [];

  return (
    <div className="bg-muted/40 min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link href="/admin/dashboard/agents">
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Agents
            </Button>
          </Link>
        </div>

        {/* Agent Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">{agent.fullName}</CardTitle>
            <CardDescription>{agent.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-muted-foreground text-sm">Agent Code</p>
                <p className="font-mono text-lg font-bold">{agent.agentCode}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Phone</p>
                <p className="font-medium">{agent.phoneNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Status</p>
                <p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      agent.isActive
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                    }`}
                  >
                    {agent.isActive ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Joined</p>
                <p className="font-medium">{formatDate(agent.createdAt)}</p>
              </div>
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
              <p className="text-3xl font-bold">
                {formatCount(agent.totalCustomers)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {formatCount(agent.activeCustomers)} active
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
                {formatCurrency(agent.totalCommissionsEarned)}
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
                {formatCurrency(agent.withdrawnCommissionsAmount)}
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
                {formatCurrency(agent.availableBalanceAmount)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Customers and Commissions */}
        <Tabs defaultValue="customers">
          <TabsList>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Agent Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      className="pl-10"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setCustomerPage(1);
                      }}
                    />
                  </div>
                </div>

                {customersLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : customers.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">
                    No customers
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Signup Date</TableHead>
                          <TableHead>Purchases</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">
                              {customer.fullName}
                            </TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell>
                              {formatDate(customer.signupDate)}
                            </TableCell>
                            <TableCell>{customer.totalPurchases}</TableCell>
                            <TableCell>
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  customer.status === "active"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                }`}
                              >
                                {customer.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle>Agent Commissions</CardTitle>
              </CardHeader>
              <CardContent>
                {commissionsLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : commissions.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">
                    No commissions
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissions.map((commission) => (
                          <TableRow key={commission.id}>
                            <TableCell>
                              {formatDate(commission.transactionDate)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {commission.productName}
                            </TableCell>
                            <TableCell>
                              ₦{commission.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {commission.commissionType === "percentage"
                                ? `${commission.commissionValue}%`
                                : `₦${commission.commissionValue}`}
                            </TableCell>
                            <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">
                              ₦
                              {commission.calculatedCommission.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  commission.status === "withdrawn"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    : commission.status ===
                                        "partially_withdrawn"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300"
                                }`}
                              >
                                {commission.status === "earned"
                                  ? "Available"
                                  : commission.status === "partially_withdrawn"
                                    ? "Partially withdrawn"
                                    : "Withdrawn"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
