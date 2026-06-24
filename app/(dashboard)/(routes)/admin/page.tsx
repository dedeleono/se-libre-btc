import React from "react";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { Overview } from "@/components/overview";
import { RecentSales } from "./_components/recent-sales";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAnalytics } from "@/actions/get-analytics";
import { getOverviewData } from "@/actions/get-overview-data";
import { formatPrice } from "@/lib/utils";
import { Users, DollarSign, BookOpen, Route, LayoutDashboardIcon } from "lucide-react";
import { getServerMessages } from "@/lib/i18n-server";

export default async function Home() {
  const t = getServerMessages();
  const [analytics, overviewData] = await Promise.all([
    getAnalytics(),
    getOverviewData()
  ]);

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-3 sm:space-y-6 sm:p-6 md:p-8 max-w-[100vw] sm:max-w-[calc(100vw-5px)] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 mb-4 md:mb-8">
          <div className="flex items-start gap-2 md:gap-4">
            <div
              className="p-2 md:p-3 rounded-xl bg-emerald-600/10 dark:bg-emerald-600/20
              border border-emerald-600/20 dark:border-emerald-600/30"
            >
              <LayoutDashboardIcon className="h-5 w-5 md:h-8 md:w-8 text-success dark:text-white" />
            </div>
            <div>
              <h2
                className="text-2xl font-black tracking-tight sm:text-4xl
                text-success dark:text-white/90 font-['Open_Sans'] text-balance"
              >
                {t.nav.dashboard}
              </h2>
              <p className="text-muted-foreground/80 text-xs dark:text-white/50 font-['Open_Sans']">
                {t.dashboard.realtimeUpdates}
              </p>
            </div>
          </div>
          {/* <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:space-x-2">
            <CalendarDateRangePicker />
            <Button size="sm" className="w-full sm:w-auto">
              Download
            </Button>
          </div> */}
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="border dark:border-white/[0.05] bg-card/50 dark:bg-black/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="sm:text-sm text-xs font-medium">
                {t.dashboard.totalRevenue}
              </CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary tabular-nums">
                {formatPrice(analytics.totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card className="border dark:border-white/[0.05] bg-card/50 dark:bg-black/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="sm:text-sm text-xs font-medium">
                {t.dashboard.students}
              </CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary tabular-nums">
                +{analytics.totalStudents}
              </div>
            </CardContent>
          </Card>

          <Card className="border dark:border-white/[0.05] bg-card/50 dark:bg-black/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="sm:text-sm text-xs font-medium">
                {t.dashboard.courses}
              </CardTitle>
              <div className="p-2 bg-primary/10 dark:bg-primary/30 rounded-full">
                <BookOpen className="h-4 w-4 text-primary dark:text-primary/90" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary tabular-nums">
                {analytics.totalCourses}
              </div>
            </CardContent>
          </Card>

          <Card className="border dark:border-white/[0.05] bg-card/50 dark:bg-black/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="sm:text-sm text-xs font-medium">
                {t.dashboard.learningPaths}
              </CardTitle>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <Route className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary tabular-nums">
                {analytics.totalLearningPaths}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-1 md:col-span-4 border dark:border-white/[0.05] bg-card/50 dark:bg-black/40 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-primary font-['Open_Sans']">{t.dashboard.overview}</CardTitle>
              <CardDescription>
                {t.dashboard.platformGrowth}
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <Overview data={overviewData} />
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-3 border dark:border-white/[0.05] bg-card/50 dark:bg-black/40 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-primary font-['Open_Sans']">{t.dashboard.latestPayments}</CardTitle>
              <CardDescription>
                {analytics.monthlyChange.sales > 0
                  ? t.dashboard.salesThisMonth(analytics.monthlyChange.sales)
                  : t.dashboard.noSalesThisMonth}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentSales />
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}
