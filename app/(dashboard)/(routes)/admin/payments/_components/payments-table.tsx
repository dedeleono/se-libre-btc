"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, BanknoteIcon, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/lib/i18n";

export function PaymentsTable() {
  const { t } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: payments, isLoading, error } = useQuery({
    queryKey: ["payments", searchQuery, statusFilter],
    queryFn: async () => {
      try {
        const { data } = await axios.get("/api/payments/getAll", {
          params: { search: searchQuery, status: statusFilter },
        });
        return data;
      } catch (error) {
        throw new Error(t.payments.unableToLoad);
      }
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      COMPLETED: {
        label: t.payments.paid,
        icon: CheckCircle,
        className: "bg-[hsl(var(--success)/0.12)] text-success border border-success dark:bg-[hsl(var(--success)/0.15)] dark:text-success dark:border-success",
        iconClassName: "text-success dark:text-success"
      },
      PENDING: {
        label: t.payments.pending,
        icon: AlertCircle,
        className: "bg-[var(--maiz-100)] text-[var(--maiz-500)] border border-[var(--maiz-500)] dark:bg-[hsl(var(--primary)/0.15)] dark:text-[var(--maiz-500)] dark:border-[var(--maiz-500)]",
        iconClassName: "text-[var(--maiz-500)] dark:text-[var(--maiz-500)]"
      },
      FAILED: {
        label: t.payments.failed,
        icon: XCircle,
        className: "bg-[hsl(var(--destructive)/0.1)] text-destructive border border-destructive dark:bg-[hsl(var(--destructive)/0.1)] dark:text-destructive dark:border-destructive",
        iconClassName: "text-destructive dark:text-destructive"
      }
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig];

    if (!config) return null;

    const Icon = config.icon;

    return (
      <Badge className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium whitespace-nowrap ${config.className}`}>
        <Icon className={`h-3 w-3 ${config.iconClassName}`} />
        {config.label}
      </Badge>
    );
  };

  const LoadingRow = () => (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-24" />
      </TableCell>
    </TableRow>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <TableRow>
      <TableCell colSpan={5} className="h-64 text-center">
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <BanknoteIcon className="h-12 w-12 mb-2 opacity-50" />
          <p className="text-lg font-medium">{message}</p>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className={`absolute left-2 top-2.5 h-4 w-4 text-muted-foreground ${isLoading ? 'animate-pulse' : ''}`} />
          <Input
            placeholder={t.payments.searchByNameOrEmail}
            className="pl-8 sm:text-sm text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading}>
          <SelectTrigger className="w-[180px] sm:text-sm text-xs">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t.payments.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="sm:text-sm text-xs">{t.payments.all}</SelectItem>
            <SelectItem value="COMPLETED" className="sm:text-sm text-xs">{t.payments.completedPlural}</SelectItem>
            <SelectItem value="PENDING" className="sm:text-sm text-xs">{t.payments.pendingPlural}</SelectItem>
            <SelectItem value="FAILED" className="sm:text-sm text-xs">{t.payments.failedPlural}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="text-primary font-bold ">{t.payments.date}</TableHead>
              <TableHead className="text-primary font-bold ">{t.payments.student}</TableHead>
              <TableHead className="text-primary font-bold ">{t.payments.product}</TableHead>
              
              <TableHead className="text-primary font-bold ">{t.payments.amount}</TableHead>
              <TableHead className="text-primary font-bold ">{t.payments.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <LoadingRow key={index} />
              ))
            ) : error ? (
              <EmptyState message={t.payments.errorLoading} />
            ) : !payments ? (
              <EmptyState message={t.payments.unableToLoad} />
            ) : payments.length === 0 ? (
              <EmptyState 
                message={
                  searchQuery || statusFilter !== 'all' 
                    ? t.payments.noResults
                    : t.payments.noPayments
                }
              />
            ) : (
              payments.map((payment: any) => (
                <TableRow key={payment.id}>
                  <TableCell className="sm:text-sm text-xs tabular-nums">
                    {format(new Date(payment.paymentDate), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="sm:text-sm text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium">{payment.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {payment.user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="sm:text-sm text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium">{payment.productName}</span>
                      <span className="text-xs text-muted-foreground">
                        {payment.productType?.replace("_", " ").toLowerCase()}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="sm:text-sm text-xs tabular-nums">{formatPrice(payment.amount)}</TableCell>
                  <TableCell className="sm:text-sm text-xs">{getStatusBadge(payment.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
