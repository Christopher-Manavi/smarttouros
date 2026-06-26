import { createFileRoute } from "@tanstack/react-router";
import { Visitors } from "./visitors";

export const Route = createFileRoute("/_authenticated/resolved-visitors")({
  component: Visitors,
});