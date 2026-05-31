import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Logo from "@/components/logo";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 w-full max-w-full overflow-x-hidden">
      <Link
        href="/examples/authentication"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute right-4 top-4 hidden md:right-8 md:top-8"
        )}
      >
        Login
      </Link>
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/students.webp')`,

            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="absolute inset-0 bg-zinc-900/60" />
        <div className="relative z-20 flex flex-col h-full">
          
          <div className="relative mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">Construyendo el futuro de nuestro país</p>
            </blockquote>
          </div>
        </div>
      </div>
      <div className="flex h-full items-center p-4 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          
            <Link href={"/"} className="mx-auto">
              <Logo alt="Logo" width={200} height={200} />
            </Link>
          
          {children}
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout
