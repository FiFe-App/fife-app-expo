import { Spacing } from "@/constants/spacing";
import { View } from "react-native";
import { Card, IconButton, Surface, useTheme } from "react-native-paper";
import { ThemedText } from "@/components/ThemedText";
import * as Clipboard from "expo-clipboard";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { dismissInviteCard } from "@/redux/reducers/userReducer";
import { addDialog, addSnack } from "@/redux/reducers/infoReducer";
import { BorderRadius } from "@/constants/borderRadius";

const INVITE_URL = "fifeapp.hu";

export default function InviteCard() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const inviteCardDismissed = useSelector((state: RootState) => state.user.inviteCardDismissed);

  if (inviteCardDismissed) return null;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(INVITE_URL);
    dispatch(addSnack({ title: "Meghívó vágólapon" }));
  };

  const handleDismiss = () => {
    dispatch(dismissInviteCard());
  };
  const handleOpen = () => {
    dispatch(addDialog({
        title: "Hívd meg a barátaidat.",
        text: "Ha úgy érzed még nem vagyunk elegen a FIFe Appban, másold le a linket és küldd el egy barátodnak!",
        submitText:"Link másolása",
        onSubmit: handleCopy
    }));
  };

  return (
    <Surface elevation={5} style={{ borderRadius: BorderRadius.md, position: "absolute", bottom: Spacing.md, left: Spacing.md, right: Spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ThemedText variant="bodyLarge" style={{ margin: Spacing.sm, flex: 1 }}>
          Hívd meg a barátaidat!
        </ThemedText>
        <IconButton icon="account-plus" onPress={handleOpen} />
        <IconButton icon="close" onPress={handleDismiss} />
      </View>
    </Surface>
  );
}
