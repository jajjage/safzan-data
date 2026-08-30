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
import { useAgents, useDisableAgent, useEnableAgent } from "@/hooks/useAgent";
import { useDebounce } from "@/hooks/useDebounce";
import axios from "axios";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const AGENTS_PAGE_SIZE = 20;

export default function AdminAgentsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const { data, error, isError, isLoading, refetch } = useAgents(
    page,
    AGENTS_PAGE_SIZE,
    debouncedSearch.trim()
  );
  const { mutate: disableAgent, isPending: disabling } = useDisableAgent();
  const { mutate: enableAgent, isPending: enabling } = useEnableAgent();

  const formatCurrency = (value: number | string | null | undefined) =>
    `₦${Number(value ?? 0).toLocaleString()}`;

  const formatCount = (value: number | string | null | undefined) =>
    Number(value ?? 0).toLocaleString();

  const agents = Array.isArray(data?.data) ? data.data : [];
  const searchTerm = debouncedSearch.trim().toLowerCase();
  const totalAgents = data?.pagination?.total ?? agents.length;
  const totalPages = Math.max(1, data?.pagination?.totalPages ?? 1);
  const safePage = Math.min(page, totalPages);
  const firstResult =
    totalAgents === 0 ? 0 : (safePage - 1) * AGENTS_PAGE_SIZE + 1;
  const lastResult = Math.min(safePage * AGENTS_PAGE_SIZE, totalAgents);
  const isSearchActive = Boolean(searchTerm);

  const handleToggleStatus = (agentId: string, isActive: boolean) => {
    if (isActive) {
      disableAgent(agentId, {
        onSuccess: () => {
          toast.success("Agent disabled");
        },
        onError: () => {
          toast.error("Failed to disable agent");
        },
      });
    } else {
      enableAgent(agentId, {
        onSuccess: () => {
          toast.success("Agent enabled");
        },
        onError: () => {
          toast.error("Failed to enable agent");
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    const message = axios.isAxiosError<{ message?: string }>(error)
      ? error.response?.data?.message
      : undefined;

    return (
      <div className="bg-muted/40 min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Agent management is unavailable</CardTitle>
              <CardDescription>
                {message ||
                  "We could not load agent accounts. Confirm this tenant has the agent feature enabled and your admin role has agent permissions."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/40 min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Agent Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all agents in the system
          </p>
        </div>

        <Card>
          <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>All Agents</CardTitle>
              <CardDescription>
                {isSearchActive
                  ? `${totalAgents.toLocaleString()} matching agents`
                  : `Total agents: ${totalAgents.toLocaleString()}`}
              </CardDescription>
            </div>
            <div className="relative w-full md:max-w-sm">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search agents..."
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setPage(1);
                }}
                className="pr-10 pl-9"
              />
              {searchInput && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchInput("");
                    setPage(1);
                  }}
                  className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  {isSearchActive
                    ? "No matching agents found"
                    : "No agents found"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Customers</TableHead>
                        <TableHead>Total Earned</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Withdrawn</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agents.map((agent) => (
                        <TableRow key={agent.id}>
                          <TableCell className="font-mono font-bold">
                            {agent.agentCode}
                          </TableCell>
                          <TableCell className="font-medium">
                            {agent.fullName}
                          </TableCell>
                          <TableCell>{agent.email}</TableCell>
                          <TableCell>
                            {formatCount(agent.totalCustomers)}
                            <span className="text-muted-foreground ml-1 text-xs">
                              ({formatCount(agent.activeCustomers)} active)
                            </span>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(agent.totalCommissionsEarned)}
                          </TableCell>
                          <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(agent.availableBalanceAmount)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(agent.withdrawnCommissionsAmount)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                agent.isActive
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                              }`}
                            >
                              {agent.isActive ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Link
                                href={`/admin/dashboard/agents/${agent.userId}`}
                              >
                                <Button size="sm" variant="outline">
                                  View
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant={
                                  agent.isActive ? "destructive" : "default"
                                }
                                onClick={() =>
                                  handleToggleStatus(
                                    agent.userId,
                                    agent.isActive
                                  )
                                }
                                disabled={disabling || enabling}
                              >
                                {agent.isActive ? "Disable" : "Enable"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalAgents > AGENTS_PAGE_SIZE && (
                  <div className="mt-6 flex items-center justify-between border-t pt-6">
                    <div className="text-muted-foreground text-sm">
                      Showing {firstResult.toLocaleString()}-
                      {lastResult.toLocaleString()} of{" "}
                      {totalAgents.toLocaleString()} agents
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          setPage((currentPage) => currentPage - 1)
                        }
                        disabled={safePage === 1}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-muted-foreground flex min-w-20 items-center justify-center text-sm">
                        {safePage} / {totalPages}
                      </div>
                      <Button
                        onClick={() =>
                          setPage((currentPage) => currentPage + 1)
                        }
                        disabled={safePage >= totalPages}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
