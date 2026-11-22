import toDistanceText from "@/lib/functions/distanceText";
import elapsedTime from "@/lib/functions/elapsedTime";
import type { RequestItem } from "./types";

type PlaceFields = Pick<RequestItem, "lat" | "long" | "distance">;

/**
 * "Bárhol" for a request without a place, otherwise the distance from me when
 * it is known ("3.2 km"), else just "Helyhez kötött".
 */
export function requestPlaceText({ lat, long, distance }: PlaceFields): string {
  if (lat == null || long == null) return "Bárhol";
  if (distance == null) return "Helyhez kötött";
  return distance < 100 ? "Közel hozzád" : toDistanceText(distance / 1000);
}

/** "2 órája" / "3 napja"; the age of the request, as everywhere else in the app. */
export function requestAge(createdAt: string): string {
  return elapsedTime(createdAt) ?? "";
}

/** First line of the text, for one-line previews. */
export function firstLine(text: string): string {
  return text.split("\n")[0]?.trim() ?? "";
}
