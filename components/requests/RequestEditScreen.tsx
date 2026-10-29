import { useAppTheme } from "@/assets/theme";
import NewMarkerIcon from "@/assets/images/newMarkerIcon";
import MapSelector from "@/components/MapSelector/MapSelector";
import containerStyle from "@/components/styles";
import TagInput from "@/components/TagInput";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { useMyLocation } from "@/hooks/useMyLocation";
import { countBucket, trackEvent } from "@/lib/analytics";
import {
  DEFAULT_REQUEST_RADIUS,
  REQUEST_LIMITS,
  REQUEST_RADIUS_OPTIONS,
} from "@/lib/requests/types";
import { uploadRequestImages } from "@/lib/requests/requestImages";
import { supabase } from "@/lib/supabase/supabase";
import { addSnack } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { CircleType } from "@/redux/store.type";
import * as ExpoImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import {
  HelperText,
  IconButton,
  Modal,
  Portal,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
  TouchableRipple,
  Icon,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import SectionLabel from "../buziness/SectionLabel";
import { Button } from "../Button";
import FiFeMap from "../mapView/FiFeMap";
import { Marker } from "../mapView/mapView";
import { ThemedView } from "../ThemedView";

/** The new-request form: text, up to four images, a place (or "Bárhol") and keywords. */
export default function RequestEditScreen() {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const uid = useSelector((state: RootState) => state.user.uid);
  const { myLocation } = useMyLocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<ExpoImagePicker.ImagePickerAsset[]>([]);
  const [circle, setCircle] = useState<CircleType | undefined>(undefined);
  const [radius, setRadius] = useState<number>(DEFAULT_REQUEST_RADIUS);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const trimmedTitle = title.trim();
  const titleTooShort = trimmedTitle.length < REQUEST_LIMITS.titleMin;
  const canSubmit = !titleTooShort && !saving;
  const selectedLocation = circle?.location ?? myLocation?.coords;

  const pickImages = async () => {
    const remaining = REQUEST_LIMITS.imagesMax - images.length;
    if (remaining <= 0) return;
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    }).catch((error) => {
      console.log(error);
    });
    if (result && !result.canceled) {
      setImages((prev) =>
        [...prev, ...result.assets].slice(0, REQUEST_LIMITS.imagesMax),
      );
    }
  };

  const save = async () => {
    if (!uid || !canSubmit) return;
    setSaving(true);
    try {
      const { data: created, error } = await supabase
        .from("requests")
        .insert({
          author: uid,
          title: trimmedTitle,
          description: description.trim(),
          tags,
          // The chosen circle alone, never the GPS fallback used to centre the map preview:
          // "Bárhol" has to stay without a place.
          location: circle
            ? `POINT(${circle.location.longitude} ${circle.location.latitude})`
            : null,
          radius: circle ? radius : null,
        })
        .select("id")
        .single();

      if (error || !created) {
        console.error("Error creating request:", error);
        dispatch(
          addSnack({
            // The trigger's limit message is written for the user; anything else is not.
            title:
              error?.message?.includes("nyitott kérésed")
                ? error.message
                : "Hiba történt a kérés mentése során. Próbáld újra később.",
          }),
        );
        return;
      }

      if (images.length) {
        const { paths, failed } = await uploadRequestImages(uid, created.id, images);
        if (paths.length) {
          const { error: updateError } = await supabase
            .from("requests")
            .update({ images: paths })
            .eq("id", created.id);
          if (updateError) {
            console.error("Request images DB update error:", updateError);
            dispatch(addSnack({ title: "A képeket nem sikerült a kéréshez csatolni." }));
          }
        }
        if (failed > 0) {
          dispatch(
            addSnack({
              title:
                failed === images.length
                  ? "A képek feltöltése nem sikerült."
                  : "Néhány kép feltöltése nem sikerült.",
            }),
          );
        }
      }

      trackEvent("request_created", {
        hasLocation: !!circle,
        images: countBucket(images.length),
        tags: countBucket(tags.length),
      });
      router.replace({ pathname: "/kerelmek/[id]", params: { id: created.id } });
    } finally {
      setSaving(false);
    }
  };

  const surfaceStyle = {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  };

  return (
    <>
      <Stack.Screen options={{ title: "Új kérés" }} />
      <ThemedView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: Spacing.md,
              paddingTop: Spacing.lg,
              paddingBottom: Spacing.xxl,
              gap: Spacing.lg,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, paddingHorizontal: Spacing.xs }}
            >
              Kérj segítséget a közösségtől. A hozzád közel élők, és akiknek ehhez van bizniszük,
              előre kapják.
            </Text>

            <View style={{ gap: Spacing.sm }}>
              <SectionLabel label="Mire van szükséged?" required />
              <Surface elevation={1} style={surfaceStyle}>
                <TextInput
                  testID="request-title"
                  mode="outlined"
                  label="Röviden *"
                  value={title}
                  maxLength={REQUEST_LIMITS.titleMax}
                  onChangeText={setTitle}
                />
                <TextInput
                  testID="request-description"
                  mode="outlined"
                  label="Részletek"
                  value={description}
                  multiline
                  numberOfLines={4}
                  maxLength={REQUEST_LIMITS.descriptionMax}
                  onChangeText={setDescription}
                />
                {title.length > 0 && titleTooShort && (
                  <HelperText type="error" visible style={{ paddingLeft: 0 }}>
                    Legalább {REQUEST_LIMITS.titleMin} karakter kell.
                  </HelperText>
                )}
              </Surface>
            </View>

            <View style={{ gap: Spacing.sm }}>
              <SectionLabel label="Képek" optional />
              <Surface elevation={1} style={surfaceStyle}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm }}>
                  {images.map((image, index) => (
                    <View key={image.uri} style={{ width: 80, height: 80 }}>
                      <Image
                        source={{ uri: image.uri }}
                        style={{ width: 80, height: 80, borderRadius: BorderRadius.md }}
                        contentFit="cover"
                      />
                      <IconButton
                        icon="close-circle"
                        size={20}
                        accessibilityLabel="Kép törlése"
                        onPress={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                        style={{ position: "absolute", top: -12, right: -12, margin: 0 }}
                      />
                    </View>
                  ))}
                  {images.length < REQUEST_LIMITS.imagesMax && (
                    <TouchableRipple
                      testID="request-add-image"
                      onPress={pickImages}
                      accessibilityLabel="Kép hozzáadása"
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: BorderRadius.md,
                        borderWidth: 1,
                        borderStyle: "dashed",
                        borderColor: theme.colors.outline,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon source="image-plus" size={28} color={theme.colors.primary} />
                    </TouchableRipple>
                  )}
                </View>
                <HelperText type="info" visible style={{ paddingLeft: 0 }}>
                  Legfeljebb {REQUEST_LIMITS.imagesMax} kép.
                </HelperText>
              </Surface>
            </View>

            <View style={{ gap: Spacing.sm }}>
              <SectionLabel label="Hol kell a segítség?" />
              <Surface elevation={1} style={surfaceStyle}>
                <SegmentedButtons
                  value={!circle ? "net" : "map"}
                  onValueChange={(v) => {
                    if (v === "net") setCircle(undefined);
                    else setMapModalVisible(true);
                  }}
                  buttons={[
                    { value: "net", label: "Bárhol", icon: "wifi" },
                    { value: "map", label: "Térképen", icon: "map-marker" },
                  ]}
                />
                {circle ? (
                  <>
                    <View
                      style={{ borderRadius: BorderRadius.md, overflow: "hidden", height: 160 }}
                    >
                      <FiFeMap
                        zoomControlEnabled={false}
                        initialCamera={{ center: selectedLocation || undefined }}
                        style={{ width: "100%", height: 160 }}
                        moveOnMarkerPress
                      >
                        {!!selectedLocation && (
                          <Marker coordinate={selectedLocation} anchor={{ x: 0.5, y: 0.5 }}>
                            <NewMarkerIcon width={24} height={24} />
                          </Marker>
                        )}
                      </FiFeMap>
                    </View>
                    <Button mode="contained-tonal" onPress={() => setMapModalVisible(true)}>
                      Hely módosítása
                    </Button>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      Mekkora körzetből várod a segítséget?
                    </Text>
                    <SegmentedButtons
                      value={String(radius)}
                      onValueChange={(v) => setRadius(Number(v))}
                      buttons={REQUEST_RADIUS_OPTIONS.map((o) => ({
                        value: String(o.value),
                        label: o.label,
                      }))}
                    />
                  </>
                ) : (
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    A kérés nincs helyhez kötve, bárki láthatja, bárhol.
                  </Text>
                )}
              </Surface>
            </View>

            <View style={{ gap: Spacing.sm }}>
              <SectionLabel label="Kulcsszavak" optional />
              <Surface elevation={1} style={surfaceStyle}>
                <TagInput
                  placeholder="Új kulcsszó…"
                  onChange={(next) => setTags(next.slice(0, REQUEST_LIMITS.tagsMax))}
                  value={tags}
                  suggest
                />
                <HelperText type="info" visible style={{ paddingLeft: 0 }}>
                  Pl. kertészet, fúrógép. Ezek alapján találnak rád azok, akik tudnak segíteni.
                </HelperText>
              </Surface>
            </View>
          </ScrollView>

          <Surface
            elevation={2}
            style={{
              paddingHorizontal: Spacing.lg,
              paddingVertical: Spacing.md,
              borderTopWidth: 1,
              borderTopColor: theme.colors.outlineVariant,
              flexDirection: "row",
            }}
          >
            <Button
              testID="request-submit"
              mode="contained"
              icon="send"
              disabled={!canSubmit}
              loading={saving}
              onPress={save}
              style={{ flex: 1, borderRadius: BorderRadius.lg }}
              contentStyle={{ height: 56 }}
              labelStyle={{ fontFamily: "RedHatText-Bold" }}
            >
              Kérés közzététele
            </Button>
          </Surface>
        </KeyboardAvoidingView>

        <Portal>
          <Modal
            visible={mapModalVisible}
            onDismiss={() => setMapModalVisible(false)}
            style={{ alignItems: "center" }}
            contentContainerStyle={[{ width: "90%", height: "90%" }]}
            dismissableBackButton
          >
            <ThemedView style={containerStyle.containerStyle}>
              <MapSelector
                data={circle}
                setData={setCircle}
                setOpen={setMapModalVisible}
                searchEnabled
                markerOnly
              />
            </ThemedView>
          </Modal>
        </Portal>
      </ThemedView>
    </>
  );
}
