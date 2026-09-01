import { Spacing } from "@/constants/spacing";
import { Pressable, View } from "react-native";
import { IconButton, Surface } from "react-native-paper";
import { ThemedText } from "@/components/ThemedText";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { dismissInviteCard } from "@/redux/reducers/userReducer";
import { showDialog } from "@/redux/reducers/infoReducer";
import { BorderRadius } from "@/constants/borderRadius";
import { useInviteLink } from "@/hooks/useInviteLink";

export default function InviteCard() {
  const dispatch = useDispatch();
  const inviteCardDismissed = useSelector((state: RootState) => state.user.inviteCardDismissed);
  // Shared with the permanent copy button in Profil → Beállítások, so the two
  // hand out the same link and confirm it the same way.
  const { copyInviteLink } = useInviteLink();

  if (inviteCardDismissed) return null;

  const handleDismiss = () => {
    dispatch(dismissInviteCard());
  };
  const handleOpen = () => {
    dispatch(showDialog({
        title: "Hívd meg a barátaidat.",
        text: "Ha úgy érzed van egy barátod, akinek jól jönne a FiFe App, másold le a saját meghívó linkedet és küldd el neki bátran! A link megmutatja neki a profilodat.",
        submitText:"Link másolása",
        onSubmit: copyInviteLink
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
