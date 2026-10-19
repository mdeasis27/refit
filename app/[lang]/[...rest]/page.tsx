import { notFound } from "next/navigation";

/** Any unknown path under a valid locale renders the localized 404. */
export default function UnknownPath(): never {
  notFound();
}
