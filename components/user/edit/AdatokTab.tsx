import ContactEditScreen from "@/components/buziness/ContactEditScreen";
import MapSelector from "@/components/MapSelector/MapSelector";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import UsernameInput from "@/components/UsernameInput";
import { Tables } from "@/database.types";
import { CircleType } from "@/redux/store.type";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { Dispatch, RefObject, SetStateAction } from "react";
import { View } from "react-native";
import {
  Divider,
  HelperText,
  Icon,
  Button,
  Modal,
  Portal,
  TextInput,
} from "react-native-paper";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";

type UserInfo = Partial<Tables<"profiles">>;

interface AdatokTabProps {
  profile: UserInfo;
  setProfile: (profile: UserInfo) => void;
  myUid: string;
  email?: string | null;
  loading: boolean;
  onAvailabilityChange: (available: boolean | undefined) => void;
  userLocation: CircleType | undefined;
  setUserLocation: Dispatch<SetStateAction<CircleType | undefined>>;
  locationMenuVisible: boolean;
  setLocationMenuVisible: Dispatch<SetStateAction<boolean>>;
  contactEditRef: RefObject<{
    saveContacts: () => Promise<
      PostgrestSingleResponse<unknown> | { error: string } | undefined
    >;
  } | null>;
}

export default function AdatokTab({
  profile,
  setProfile,
  myUid,
  email,
  loading,
  onAvailabilityChange,
  userLocation,
  setUserLocation,
  locationMenuVisible,
  setLocationMenuVisible,
  contactEditRef,
}: AdatokTabProps) {
  const theme = useAppTheme();

  const containerStyle = {
    flex: 1,
    height: "100%" as const,
    borderRadius: BorderRadius.md,
  };

  return (
    <View>
      <ThemedText variant="bodyLarge" type="bold" style={{ marginBottom: 8 }}>
        Általános infóid
      </ThemedText>
      <TextInput
        label="Név* (kötelező)"
        value={profile?.full_name || ""}
        disabled={loading}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        autoCorrect={false}
        onChangeText={(t) => setProfile({ ...profile, full_name: t })}
      />
      <UsernameInput
        label="Felhasználónév"
        value={profile?.username || ""}
        disabled={loading}
        excludeUid={myUid}
        onAvailabilityChange={onAvailabilityChange}
        onChangeText={(t) => setProfile({ ...profile, username: t })}
        style={{ marginTop: Spacing.sm }}
      />
      <View style={{ padding: Spacing.sm }}>
        <ThemedText type="label">Email, amivel regisztráltál:</ThemedText>
        <ThemedText>{email}</ThemedText>
      </View>
      <Divider />
      <View style={{ paddingVertical: Spacing.lg }}>
        <ThemedText variant="bodyLarge" type="bold" style={{ marginBottom: Spacing.sm }}>
          Lakhelyed környéke
        </ThemedText>
        <ThemedText type="label" style={{ marginBottom: Spacing.sm }}>
          Add meg a lakhelyedet, hogy lásd a fiféket a környékeden.
        </ThemedText>
        <View style={{ flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" }}>
          <Button
            mode="outlined"
            onPress={() => setLocationMenuVisible(true)}
            icon="map-marker"
            style={{ marginBottom: Spacing.sm }}
          >
            {userLocation ? "Környék módosítása" : "Megadom a környékemet"}
          </Button>
          {!userLocation && (
            <ThemedText type="label" style={{ marginBottom: Spacing.md }}>
              Nincs lakhely beállítva
            </ThemedText>
          )}
          {userLocation && (
            <Button
              mode="text"
              onPress={() => setUserLocation(undefined)}
              icon="delete"
              textColor={theme.colors.error}
            >
              Helyzet törlése
            </Button>
          )}
        </View>
      </View>
      <Divider />
      <View style={{ gap: Spacing.sm, paddingTop: Spacing.sm, paddingBottom: 48 }}>
        <ThemedText variant="bodyLarge" type="bold">Elérhetőségeid</ThemedText>
        <View style={{ alignItems: "center" }}>
          <Icon source="alert" size={24} color={theme.colors.error} />
          <HelperText type="error" style={{ textAlign: "center" }}>
            Figyelem! Az alább megadott adatok láthatóak minden
            felhasználónak.
          </HelperText>
        </View>
        <ContactEditScreen ref={contactEditRef} />
      </View>
      <Portal>
        <Modal
          visible={locationMenuVisible}
          onDismiss={() => setLocationMenuVisible(false)}
          style={{ alignItems: "center" }}
          contentContainerStyle={[
            {
              width: "90%",
              height: "90%",
            },
          ]}
        >
          <ThemedView style={containerStyle}>
            <MapSelector
              data={userLocation}
              setData={setUserLocation}
              searchEnabled
              markerOnly
              setOpen={setLocationMenuVisible}
            />
          </ThemedView>
        </Modal>
      </Portal>
    </View>
  );
}
