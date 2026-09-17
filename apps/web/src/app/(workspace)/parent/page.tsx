import { Dashboard } from "@/features/roster";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <Dashboard role="PARENT" query={await searchParams} />;
}
