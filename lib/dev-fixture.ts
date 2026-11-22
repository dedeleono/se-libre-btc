import { notFound } from "next/navigation";

export function devFixtureOnly(nodeEnv: string | undefined = process.env.NODE_ENV) {
  if (nodeEnv === "production") notFound();
}
