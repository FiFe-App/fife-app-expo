import { router } from "expo-router";
import { View } from "react-native";
import { Appbar, Badge } from "react-native-paper";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useAppTheme } from "@/assets/theme";

/** Appbar entry point to the chat list, with the unread counter. */
export const MessagesAppbarAction = () => {
  const messagingEnabled = useSelector(
    (state: RootState) => state.user.messagingEnabled,
  );
  const unreadCounts = useSelector((state: RootState) => state.chat.unreadCounts);
  const theme = useAppTheme();

  if (!messagingEnabled) return <View style={{width:48}}></View>;

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <View>
      <Appbar.Action
        icon="message"
        color={theme.colors.primary}
        onPress={() => router.push("/chats")}
        accessibilityLabel="Üzeneteid"
      />
      {totalUnread > 0 && (
        // The badge sits on top of the icon, so it must not swallow the tap.
        <View pointerEvents="none" style={{ position: "absolute", top: 2, right: 2 }}>
          <Badge size={16} style={{ backgroundColor: theme.colors.error }}>
            {totalUnread}
          </Badge>
        </View>
      )}
    </View>
  );
};

export default MessagesAppbarAction;
