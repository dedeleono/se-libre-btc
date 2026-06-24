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

type PaymentWithUser = {
  id: string;
  amount: string;
  status: string;
  productType: string;
  productName: string;
  paymentDate: string;
  user: {
    name: string | null;
    email: string;
  };
};

export function PaymentsTable() {
  const { t } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: payments, isLoading, error } = useQuery<PaymentWithUser[]>({
    queryKey: ["payments", searchQuery, statusFilter],
    queryFn: async () => {
      try {
        const { data } = await axios.get("/api/payments/getPaymentsByStudent", {
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
        className: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30",
        iconClassName: "text-green-600 dark:text-green-400"
      },
      PENDING: {
        label: t.payments.pending,
        icon: AlertCircle,
        className: "bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30",
        iconClassName: "text-yellow-600 dark:text-yellow-400"
      },
      FAILED: {
        label: t.payments.failed,
        icon: XCircle,
        className: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30",
        iconClassName: "text-red-600 dark:text-red-400"
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
    <TableRow className="hover:bg-muted/50">
      <TableCell className="py-4">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="py-4">
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell className="py-4">
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell className="py-4">
        <Skeleton className="h-6 w-24" />
      </TableCell>
    </TableRow>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <TableRow>
      <TableCell colSpan={4} className="h-64 text-center">
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
            placeholder={t.payments.searchByDate}
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

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-primary font-bold py-4">{t.payments.date}</TableHead>
              <TableHead className="text-primary font-bold py-4">{t.payments.product}</TableHead>
              <TableHead className="text-primary font-bold py-4">{t.payments.amount}</TableHead>
              <TableHead className="text-primary font-bold py-4">{t.payments.status}</TableHead>
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
              payments.map((payment: PaymentWithUser) => (
                <TableRow key={payment.id} className="hover:bg-muted/50">
                  <TableCell className="py-4 sm:text-sm text-xs tabular-nums">
                    {format(new Date(payment.paymentDate), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="py-4 sm:text-sm text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium">{payment.productName}</span>
                      <span className="text-xs text-muted-foreground">
                        {payment.productType.replace("_", " ").toLowerCase()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 sm:text-sm text-xs font-medium tabular-nums">
                    {formatPrice(payment.amount)}
                  </TableCell>
                  <TableCell className="py-4 sm:text-sm text-xs">
                    {getStatusBadge(payment.status)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
