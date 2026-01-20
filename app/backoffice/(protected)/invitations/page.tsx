import { Suspense } from "react";
import InvitationsTableLoader from "./InvitationsTableLoader";
import InvitationsHeader from "./InvitationsHeader";
import InvitationsSummary from "./InvitationsSummary";
import { Card, CardBody, Skeleton, Spinner } from "@heroui/react";

// Forzar renderizado dinámico (no estático)
export const dynamic = "force-dynamic";

interface InvitationsPageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

function TableSkeleton() {
  return (
    <Card className="mb-6">
      <CardBody className="p-0">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <Skeleton className="h-10 w-1/4 rounded-lg" />
              <Skeleton className="h-10 w-1/6 rounded-lg" />
              <Skeleton className="h-10 w-1/6 rounded-lg" />
              <Skeleton className="h-10 w-1/6 rounded-lg" />
              <Skeleton className="h-10 w-1/6 rounded-lg" />
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardBody className="text-center">
            <Skeleton className="h-8 w-16 mx-auto mb-2 rounded-lg" />
            <Skeleton className="h-4 w-24 mx-auto rounded-lg" />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export default async function InvitationsPage({
  searchParams,
}: InvitationsPageProps) {
  const params = await searchParams;
  const searchTerm = params.search || "";

  return (
    <div>
      {/* Header es un Client Component, Suspense no necesario pero lo dejamos por consistencia */}
      <Suspense fallback={<Spinner size="lg" />}>
        <InvitationsHeader />
      </Suspense>

      {/* La tabla ahora hace streaming real - el fetch está dentro del Suspense boundary */}
      <Suspense fallback={<TableSkeleton />}>
        <InvitationsTableLoader searchTerm={searchTerm} />
      </Suspense>

      {/* Summary es un Server Component async - streaming real */}
      <Suspense fallback={<StatsSkeleton />}>
        <InvitationsSummary />
      </Suspense>
    </div>
  );
}
