import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Overview } from "@/components/overview";
import { overviewWindow } from "@/lib/overview-buckets";
import { toOverviewRows, type OverviewRow } from "@/lib/overview-chart";
import { getServerMessages } from "@/lib/i18n-server";

const REVENUE = [0, 45000, 120000, 98000, 0, 210000, 175050, 330000, 260000, 410000, 385000, 1250075];
const STUDENTS = [3, 8, 14, 9, 0, 22, 18, 31, 27, 40, 36, 52];
const COURSES = [0, 1, 0, 0, 0, 2, 0, 1, 0, 0, 1, 3];
const ZEROS = new Array<number>(12).fill(0);

function fixtureRows(data: string | undefined): OverviewRow[] {
  const { monthStarts } = overviewWindow(new Date("2026-11-17T12:00:00Z"));
  switch (data) {
    case "error":
      return [];
    case "empty":
      return toOverviewRows({ monthStarts, revenueCents: ZEROS, students: ZEROS, courses: ZEROS });
    case "zero-revenue":
      return toOverviewRows({ monthStarts, revenueCents: ZEROS, students: STUDENTS, courses: COURSES });
    default:
      return toOverviewRows({ monthStarts, revenueCents: REVENUE, students: STUDENTS, courses: COURSES });
  }
}

export default async function OverviewFixturePage(props: { searchParams: Promise<{ data?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { data } = await props.searchParams;
  const t = getServerMessages();

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 md:col-span-4 border dark:border-white/[0.05] bg-card/50 dark:bg-black/40 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-primary font-['Open_Sans']">{t.dashboard.overview}</CardTitle>
            <CardDescription>{t.dashboard.platformGrowth}</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={fixtureRows(data)} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
