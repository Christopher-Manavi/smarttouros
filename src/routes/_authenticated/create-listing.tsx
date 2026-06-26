import { createFileRoute } from "@tanstack/react-router";
import { NewListing } from "./listings.new";

export const Route = createFileRoute("/_authenticated/create-listing")({
  component: NewListing,
});