import { useAppTheme } from "@/assets/theme";
import { Spacing } from "@/constants/spacing";
import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";
import type { RequestItem, RequestScope } from "@/lib/requests/types";
import { FlatList, View } from "react-native";
import { ActivityIndicator, Icon } from "react-native-paper";
import RequestCard from "../requests/RequestCard";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import NewRequestButton from "./NewRequestButton";

/** The empty-state copy per slice of the kérések: what the user can do about it differs. */
const EMPTY: Record<RequestScope, { title: string; hint: string }> = {
  all: { title: "Még nincs kérés.", hint: "Légy te az első, aki kér valamit a közösségtől!" },
  for_me: {
    title: "Most nincs a környékeden, ami neked való kérés.",
    hint: "Nézd meg a Szűrés › Mind szűrőt, vagy kérj te valamit.",
  },
  mine: { title: "Még nem kértél semmit.", hint: "Ha elakadtál valamivel, kérdezd meg a közösséget!" },
  solved: { title: "Még nincs megoldott kérés.", hint: "Itt jelennek meg az archivált kérések." },
};

interface RequestListProps {
  data: RequestItem[];
  loading: boolean;
  fetched: boolean;
  error: string | null;
  q: string;
  scope: RequestScope;
  /** What is in the search box right now, carried into the "Új kérés" button. */
  typed: string;
  onEndReached: () => void;
  onDeleted: (id: number) => void;
  onBlocked: () => void;
  onSolved: (id: number) => void;
}

/**
 * The list of the kérések. The one "Új kérés" button is above it, whatever the list holds. (The
 * map view has no list: it shows the picked request as a card, see the search screen.)
 */
export const RequestList = ({
  data,
  loading,
  fetched,
  error,
  q,
  scope,
  typed,
  onEndReached,
  onDeleted,
  onBlocked,
  onSolved,
}: RequestListProps) => {
  const theme = useAppTheme();
  const empty = fetched && !loading && !error && data.length === 0;
  const emptyText = q.trim()
    ? { title: "Nincs találat.", hint: "Próbálj más szót, vagy válts a Mind szűrőre." }
    : EMPTY[scope];

  return (
    <FlatList
      testID="search-requests"
      data={data}
      keyExtractor={(item) => String(item.id)}
      keyboardShouldPersistTaps="handled"
      onEndReachedThreshold={0.6}
      onEndReached={onEndReached}
      contentContainerStyle={{
        padding: Spacing.md,
        gap: Spacing.sm,
        paddingBottom: MODE_SWITCH_CLEARANCE + Spacing.md,
        flexGrow: 1,
      }}
      ListHeaderComponent={<NewRequestButton text={typed} testID="search-new-request" />}
      renderItem={({ item }) => (
        <RequestCard data={item} onDeleted={onDeleted} onBlocked={onBlocked} onSolved={onSolved} />
      )}
      ListFooterComponent={
        loading ? <ActivityIndicator style={{ marginVertical: Spacing.lg }} /> : null
      }
      ListEmptyComponent={
        error ? (
          <ThemedView type="error" testID="requests-error" style={{ alignItems: "center", padding: Spacing.md }}>
            <ThemedText type="error" style={{ textAlign: "center" }}>
              {error}
            </ThemedText>
          </ThemedView>
        ) : empty ? (
          <View style={{ alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.xl }}>
            <Icon source="hand-heart-outline" size={40} color={theme.colors.onSurfaceVariant} />
            <ThemedText type="bold" style={{ textAlign: "center" }}>{emptyText.title}</ThemedText>
            <ThemedText style={{ textAlign: "center", color: theme.colors.onSurfaceVariant }}>
              {emptyText.hint}
            </ThemedText>
          </View>
        ) : null
      }
    />
  );
};

export default RequestList;
