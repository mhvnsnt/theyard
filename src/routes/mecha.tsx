import { createFileRoute } from "@tanstack/react-router";
import { MechaBay } from "@/components/mecha-bay";

export const Route = createFileRoute("/mecha")({
  component: MechaBay,
});
