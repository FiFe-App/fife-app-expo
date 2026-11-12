import { useFocusEffect } from "expo-router";
import { FiFeRadar } from "@/components/user/FiFeRadar";
import RequestsForYou from "@/components/requests/RequestsForYou";
import { ThemedView } from "@/components/ThemedView";
import { Spacing } from "@/constants/spacing";
import { fetchUnreadCounts } from "@/lib/chat/fetchUnreadCounts";
import { setUnreadCounts } from "@/redux/reducers/chatReducer";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { clearOptions } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { useCallback, useEffect } from "react";
import { ScrollView } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import InviteCard from "@/components/InviteCard";
import { useFifeSearch } from "@/hooks/useFifeSearch";
import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";

/**
 * Környék: the FiFe Radar (who is around) and, below it, the requests that suit the user.
 * Browsing bizniszek lives on the search screen.
 */
export default function Index() {
  const { uid, messagingEnabled } = useSelector((state: RootState) => state.user);
  const searchCircle = useSelector(
    (state: RootState) => state.users.userSearchParams?.searchCircle,
  );
  const { lastReadAt } = useSelector((state: RootState) => state.chat);
  const dispatch = useDispatch();

  const { fetch, data, fetchNextPage, hasMore, error, loading } = useFifeSearch();

  useEffect(() => {
    fetch();
  }, [searchCircle, fetch]);

  useEffect(() => {
    return () => {
      dispatch(clearOptions());
    };
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      if (data.length === 0) {
        fetch();
      }
      if (uid) dispatch(viewFunction({ key: "homePage", uid }));

      if (uid && messagingEnabled) {
        fetchUnreadCounts(uid, lastReadAt).then((counts) => {
          if (counts) dispatch(setUnreadCounts(counts));
        });
      }
    }, [data.length, uid, messagingEnabled, lastReadAt, dispatch, fetch]),
  );

  if (!uid) return null;

  return (
    <ThemedView style={{ flex: 1, minHeight: 0 }} type="default">
      <ScrollView
        style={{ flex: 1, minHeight: 0 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: Spacing.xxl + MODE_SWITCH_CLEARANCE }}
      >
        <FiFeRadar
          data={data}
          load={fetchNextPage}
          canLoadMore={hasMore}
          loading={loading}
          error={error}
        />
        <RequestsForYou />
      </ScrollView>
      <InviteCard />
    </ThemedView>
  );
}
