import { Redirect } from "expo-router";

import { searchHref } from "@/lib/search/href";

/**
 * The bizniszek are searched on the search screen now. This route is only left so old links and
 * a last-route restored from before keep working.
 */
export default function BuzinessIndex() {
  return <Redirect href={searchHref("biznisz")} />;
}
