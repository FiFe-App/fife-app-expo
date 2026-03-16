import MapSelector from "@/components/MapSelector/MapSelector";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { storeUserSearchParams } from "@/redux/reducers/usersReducer";
import { setLocation } from "@/redux/reducers/userReducer";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { View } from "react-native";
import { Modal, Portal, useTheme } from "react-native-paper";
import { CircleType } from "@/redux/store.type";
import { Button } from "@/components/Button";

const Register = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const [myLocation, setMyLocation] = useState<CircleType | undefined>();
  const [searchCircle, setSearchCircle] = useState<CircleType | undefined>();

  const containerStyle = {
    padding: 20,
    margin: 20,
    flex: 1,
    height: 200
  };

  return (
    <ThemedView style={{ flex: 1, padding: 8 }}>
      <View style={{ justifyContent: "center" }}>
        <ThemedText type="title" style={{ marginBottom: 16 }}>
          FiFe Radar
        </ThemedText>
        <ThemedText type="subtitle" style={{ marginBottom: 16 }}>
          Ha megadod a hozzávetőleges lakhelyed, láthatod a környéken élő fiféket!{"\n\n"}
          Elég nagyjából bejelölnöd a térképen a környékedet!
        </ThemedText>
      </View>
      <View style={{ flex: 1, marginVertical: 20, gap: 12 }}>
        <Button icon={myLocation ? "check-circle" : undefined} mode={myLocation ? "contained-tonal" : "contained"} onPress={() => setLocationMenuVisible(true)}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {myLocation ? "Környék módosítása" : "Megadom a környékemet"}
          </View>
        </Button>
        {myLocation && <View style={{ alignItems: "flex-end", }}>
          <Button mode="text"
            icon="delete"
            textColor={theme.colors.error}
            onPress={() => setMyLocation(undefined)}>Törlés</Button>
        </View>}
      </View>
      <Portal>
        <Modal
          visible={locationMenuVisible}
          onDismiss={() => {
            setLocationMenuVisible(false);
          }}
          contentContainerStyle={[
            {
              height: 500,
              borderRadius: 16,
            },
          ]}
        >
          <ThemedView style={containerStyle}>
            <MapSelector
              data={searchCircle}
              setData={(sC) => {
                console.log("set", sC);
                setMyLocation(sC);
                setSearchCircle(sC);

                if (sC && "location" in sC && "radius" in sC) {
                  // Set location in user data
                  dispatch(setLocation({
                    latitude: sC.location.latitude,
                    longitude: sC.location.longitude,
                    radius: sC.radius,
                  }));
                  // Also update search params
                  dispatch(storeUserSearchParams({ searchCircle: sC }));
                }
              }}
              searchEnabled
              setOpen={setLocationMenuVisible}
            />
          </ThemedView>
        </Modal>
      </Portal>
    </ThemedView>
  );
};

export default Register;
