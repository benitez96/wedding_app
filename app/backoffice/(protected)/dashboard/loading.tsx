import { Spinner } from "@heroui/spinner";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" label="Cargando dashboard..." />
    </div>
  );
}
