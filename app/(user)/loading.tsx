import { LoadingCards, Skeleton } from "@/components/ui";
export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-48" />
      <LoadingCards />
    </div>
  );
}
