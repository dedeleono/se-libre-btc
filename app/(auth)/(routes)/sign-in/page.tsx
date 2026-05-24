// import {RegisterLink, LoginLink} from "@kinde-oss/kinde-auth-nextjs/components";
import { Suspense } from "react";
import UserAuthForm from "@/components/forms/user-auth-form";
import UserAuthFormSkeleton from "@/components/forms/user-auth-form-skeleton";

export default function Page() {
  return (
    <Suspense fallback={<UserAuthFormSkeleton />}>
      <UserAuthForm />
    </Suspense>
  );
}
