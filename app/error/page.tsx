import { Button } from "@/components/ui/button";
import { getServerMessages } from "@/lib/i18n-server";
import Link from "next/link";

export default function ErrorPage({
    searchParams,
}: {
    searchParams: { message: string };
}) {
    const t = getServerMessages();

    return (
        <div className="h-screen flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mb-4">{t.common.somethingWentWrong}</h1>
            <p className="text-muted-foreground mb-4">{searchParams.message}</p>
            <Button asChild>
                <Link href="/sign-in">
                    {t.nav.signIn}
                </Link>
            </Button>
        </div>
    );
}
