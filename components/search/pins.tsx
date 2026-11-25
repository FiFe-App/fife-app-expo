import NewMarkerIcon from "@/assets/images/newMarkerIcon";
import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { NearestProfile } from "@/redux/store.type";
import { View } from "react-native";
import { Icon } from "react-native-paper";
import ProfileImage from "../ProfileImage";

const FIFE_PIN = 44;

/** A biznisz on the map: the app's marker, bigger when picked. */
export const BuzinessPin = ({ selected }: { selected: boolean }) => (
  <View style={{ transform: [{ scale: selected ? 1.5 : 1 }] }}>
    <NewMarkerIcon />
  </View>
);

/** A fife on the map: their profile picture, ringed when picked. */
export const FifePin = ({ profile, selected }: { profile: NearestProfile; selected: boolean }) => {
  const theme = useAppTheme();
  return (
    <View
      style={{
        width: FIFE_PIN,
        height: FIFE_PIN,
        borderRadius: BorderRadius.full,
        borderWidth: selected ? 4 : 2,
        borderColor: selected ? theme.colors.primary : theme.colors.background,
        overflow: "hidden",
        backgroundColor: theme.colors.surfaceVariant,
        transform: [{ scale: selected ? 1.2 : 1 }],
      }}
    >
      <ProfileImage
        uid={profile.id}
        avatar_url={profile.avatar_url}
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
};

/** A request on the map: a heart in a circle, bigger and ringed when picked. */
export const RequestPin = ({ selected, solved }: { selected: boolean; solved: boolean }) => {
  const theme = useAppTheme();
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: BorderRadius.full,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: selected ? 4 : 2,
        borderColor: selected ? theme.colors.onPrimary : theme.colors.background,
        backgroundColor: solved ? theme.colors.nature : theme.colors.primary,
        transform: [{ scale: selected ? 1.25 : 1 }],
      }}
    >
      <Icon source="hand-heart" size={20} color={theme.colors.onPrimary} />
    </View>
  );
};
