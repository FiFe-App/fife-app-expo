import { Spacing } from "@/constants/spacing";
import { Pressable, View } from "react-native";
import { IconButton, Surface } from "react-native-paper";
import { ThemedText } from "@/components/ThemedText";
import * as Clipboard from "expo-clipboard";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { dismissInviteCard } from "@/redux/reducers/userReducer";
import { showDialog, addSnack } from "@/redux/reducers/infoReducer";
import { BorderRadius } from "@/constants/borderRadius";

const INVITE_URL = "fifeapp.hu";

export default function InviteCard() {
  const dispatch = useDispatch();
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
    dispatch(showDialog({
        title: "Hívd meg a barátaidat.",
        text: "Ha úgy érzed van egy barátod, akinek jól jönne a FIFe App, másold le a linket és küldd el neki bátran!",
        submitText:"Link másolása",
        onSubmit: handleCopy
    }));
  };

  return (
    <Surface elevation={5} style={{ borderRadius: BorderRadius.md, position: "absolute", bottom: Spacing.md, left: Spacing.md, right: Spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable onPress={handleOpen} style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingLeft: Spacing.md }}>
          <ThemedText variant="bodyLarge" style={{ flex: 1 }}>
            Hívd meg a barátaidat!
          </ThemedText>
          <IconButton icon="account-plus" onPress={handleOpen} />
        </Pressable>
        <IconButton icon="close" onPress={handleDismiss} />
      </View>
    </Surface>
  );
}
