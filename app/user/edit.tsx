import ContactEditScreen from "@/components/buziness/ContactEditScreen";
import MapSelector from "@/components/MapSelector/MapSelector";
import ProfileImage from "@/components/ProfileImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import UsernameInput from "@/components/UsernameInput";
import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import { setOptions } from "@/redux/reducers/infoReducer";
import { setName, setUserData, setThemePreference } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { UserState, CircleType } from "@/redux/store.type";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import * as ExpoImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ScrollView, View, TouchableWithoutFeedback } from "react-native";
import {
  Button,
  Divider,
  HelperText,
  Icon,
  IconButton,
  Menu,
  Modal,
  Portal,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

type UserInfo = Partial<Tables<"profiles">>;

export default function Index() {
  const theme = useTheme();
  const { uid: myUid, userData, themePreference }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [profile, setProfile] = useState<UserInfo>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | undefined>(undefined);
  const [themeMenuVisible, setThemeMenuVisible] = useState(false);
  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<CircleType | undefined>();
  const dispatch = useDispatch();
  const contactEditRef = useRef<{
    saveContacts: () => Promise<
      | PostgrestSingleResponse<unknown>
      | {
          error: string;
      }
      | undefined
    >;
      }>(null);

  const load = () => {
    console.log("loaded user", myUid);
    if (!myUid) return;
    setLoading(true);

    supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, website, created_at, updated_at, viewed_functions")
      .eq("id", myUid)
      .then(async ({ data, error }) => {
        if (error) {
          console.log("err", error.message);
          return;
        }
        if (data) {
          setProfile(data[0]);
          // Fetch own location via secure function
          const { data: loc } = await supabase.rpc("get_my_profile_location");
          const myLoc = loc?.[0];
          if (myLoc?.location_wkt) {
            const match = myLoc.location_wkt.match(/POINT\(([\d.-]+) ([\d.-]+)\)/);
            if (match) {
              setUserLocation({
                location: {
                  latitude: parseFloat(match[2]),
                  longitude: parseFloat(match[1]),
                },
                radius: Number(myLoc.location_radius_m ?? 0),
              });
            }
          }
          console.log(data);
          setLoading(false);
        }
      });
  };
  useFocusEffect(
    useCallback(() => {
      const save = async () => {
        setLoading(true);
        if (!myUid) return;

        const response = await contactEditRef.current?.saveContacts();
        console.log(response);

        if (response?.error) {
          console.log(response.error);
          return;
        }
        supabase
          .from("profiles")
          .upsert(
            {
              ...profile,
              id: myUid,
              // Add location if user has selected one
              ...(userLocation && {
                location: `POINT(${userLocation.location.longitude} ${userLocation.location.latitude})`,
                location_radius_m: userLocation.radius,
              }),
            },
            { onConflict: "id" },
          )
          .then((res) => {
            setLoading(false);
            if (res.error) {
              console.log(res.error);
              return;
            }
            setProfile(profile);
            dispatch(setName(profile?.full_name));
            console.log(res);
            router.navigate("/user");
          });
      };
      dispatch(
        setOptions([
          {
            title: "Mentés",
            icon: "check",
            onPress: save,
            disabled:
              !profile?.full_name ||
              (!!profile?.username && usernameAvailable === false),
          },
        ]),
      );
      return () => { };
    }, [dispatch, myUid, profile, userLocation, usernameAvailable]),
  );
  useFocusEffect(
    useCallback(() => {
      load();
      return () => { };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myUid]),
  );
  const pickImage = async () => {
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      base64: true,
    }).catch((error) => {
      console.log(error);
    });

    if (result && !result?.canceled) {
      console.log(result);

      setProfile({ ...profile, avatar_url: "" });
      setImageLoading(true);
      uploadImage(result.assets[0]).then((res) => {
        setProfile({ ...profile, avatar_url: res });
        setImageLoading(false);
      });
    } else console.log("cancelled");
  };
  const uploadImage = async (image: ExpoImagePicker.ImagePickerAsset) => {
    if (!image || !image.fileName) return;

    const response = await fetch(image.uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();
    const upload = await supabase.storage
      .from("avatars")
      .upload(myUid + "/" + image.fileName, arrayBuffer, {
        contentType: image.mimeType,
        upsert: true,
      })
      .then(async ({ data, error }) => {
        console.log("upload", data);
        if (error)
          console.log(error);

        if (data?.path && myUid)
          supabase
            .from("profiles")
            .upsert(
              {
                avatar_url: image.fileName,
                id: myUid,
              },
              { onConflict: "id" },
            )
            .then((res) => {
              console.log("profile upsert", res);
            });

        return image.fileName;
      })
      .catch((error) => {
        return error;
      });

    return upload;
  };
  const containerStyle = {
    backgroundColor: theme.colors.surface,
    padding: 20,
    margin: 20,
    borderRadius: 16,
    height: 400
  };

  if (myUid)
    return (
      <ThemedView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 8 }}>
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <View style={{ width: 100 }}>
              <ProfileImage
                key={profile?.avatar_url}
                uid={myUid}
                avatar_url={profile?.avatar_url}
                propLoading={imageLoading}
                style={{
                  width: 100,
                  height: 100,
                }}
              />
              <IconButton
                icon="upload"
                onPress={pickImage}
                mode="contained-tonal"
                style={{ position: "absolute", right: 0, bottom: 0 }}
              />
            </View>
          </View>
          <TextInput
            label="Teljes név* (kötelező)"
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
            onAvailabilityChange={setUsernameAvailable}
            onChangeText={(t) => setProfile({ ...profile, username: t })}
            style={{ marginTop: 8 }}
          />
          <View style={{ padding: 16 }}>
            <ThemedText type="label">Email, amivel regisztráltál:</ThemedText>
            <ThemedText>{userData?.email}</ThemedText>
          </View>
          <Divider />
          <View style={{ padding: 16 }}>
            <Menu
              visible={themeMenuVisible}
              onDismiss={() => setThemeMenuVisible(false)}
              anchor={
                <TouchableWithoutFeedback 
                  onPress={() => setThemeMenuVisible(true)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Téma kiválasztása"
                >
                  <View>
                    <TextInput
                      mode="outlined"
                      label="Téma"
                      value={
                        themePreference === "auto" 
                          ? "Automatikus" 
                          : themePreference === "dark" 
                            ? "Sötét" 
                            : "Világos"
                      }
                      right={<TextInput.Icon icon="chevron-down" />}
                      editable={false}
                      pointerEvents="none"
                    />
                  </View>
                </TouchableWithoutFeedback>
              }
            >
              <Menu.Item
                onPress={() => {
                  dispatch(setThemePreference("auto"));
                  setThemeMenuVisible(false);
                }}
                title="Automatikus"
                leadingIcon={themePreference === "auto" ? "check" : undefined}
              />
              <Menu.Item
                onPress={() => {
                  dispatch(setThemePreference("light"));
                  setThemeMenuVisible(false);
                }}
                title="Világos"
                leadingIcon={themePreference === "light" ? "check" : undefined}
              />
              <Menu.Item
                onPress={() => {
                  dispatch(setThemePreference("dark"));
                  setThemeMenuVisible(false);
                }}
                title="Sötét"
                leadingIcon={themePreference === "dark" ? "check" : undefined}
              />
            </Menu>
          </View>
          <Divider />
          <View style={{ paddingVertical: 16 }}>
            <ThemedText type="subtitle" style={{ marginBottom: 8 }}>
              Helyzet
            </ThemedText>
            <ThemedText type="label" style={{ marginBottom: 8 }}>
              Add meg a helyzetedet, hogy lásd a fiféket a környékeden.
            </ThemedText>
            {!userLocation && (
              <ThemedText type="label" style={{ marginBottom: 12 }}>
                Nincs helyzet beállítva
              </ThemedText>
            )}
            <View style={{flexDirection:"row",gap:4,flexWrap:"wrap"}}>  
              <Button
                mode="outlined"
                onPress={() => setLocationMenuVisible(true)}
                icon="map-marker"
                style={{ marginBottom: 8 }}
              >
                {userLocation ? "Helyzet módosítása" : "Megadom a helyzetem"}
              </Button>
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
          <View style={{ gap: 8, paddingTop: 8 }}>
            <ThemedText type="subtitle">Elérhetőségeid</ThemedText>
            <View style={{ alignItems: "center" }}>
              <Icon source="alert" size={24} color={theme.colors.error} />
              <HelperText type="error" style={{ textAlign: "center" }}>
                Figyelem! Az alább megadott adatok láthatóak minden
                felhasználónak.
              </HelperText>
            </View>
            <ContactEditScreen ref={contactEditRef} />
          </View>
        </ScrollView>
        <Portal>
          <Modal
            visible={locationMenuVisible}
            onDismiss={() => setLocationMenuVisible(false)}
            contentContainerStyle={[
              {
                height: "auto",
                borderRadius: 16,
              },
            ]}
          >
            <ThemedView style={containerStyle}>
              <MapSelector
                data={userLocation}
                setData={(location) => {
                  console.log("Selected location:", location);
                  setUserLocation(location);
                }}
                searchEnabled
                setOpen={setLocationMenuVisible}
              />
            </ThemedView>
          </Modal>
        </Portal>
      </ThemedView>
    );
}
