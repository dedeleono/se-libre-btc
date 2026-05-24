import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ErrorPage({
    searchParams,
}: {
    searchParams: { message: string };
}) {
    return (
        <div className="h-screen flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p className="text-muted-foreground mb-4">{searchParams.message}</p>
            <Button asChild>
                <Link href="/sign-in">
                    Go to Sign In
                </Link>
            </Button>
        </div>
    );
}
