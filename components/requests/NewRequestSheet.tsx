import { useAppTheme } from "@/assets/theme";
import NewMarkerIcon from "@/assets/images/newMarkerIcon";
import MapSelector from "@/components/MapSelector/MapSelector";
import containerStyle from "@/components/styles";
import TagInput from "@/components/TagInput";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { useMyLocation } from "@/hooks/useMyLocation";
import { countBucket, trackEvent } from "@/lib/analytics";
import { uploadRequestImages } from "@/lib/requests/requestImages";
import {
  DEFAULT_REQUEST_RADIUS,
  REQUEST_LIMITS,
  REQUEST_RADIUS_OPTIONS,
} from "@/lib/requests/types";
import { supabase } from "@/lib/supabase/supabase";
import { addSnack } from "@/redux/reducers/infoReducer";
import { closeRequestComposer } from "@/redux/reducers/requestsReducer";
import { RootState } from "@/redux/store";
import { CircleType } from "@/redux/store.type";
import { Image } from "expo-image";
import * as ExpoImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  HelperText,
  Icon,
  IconButton,
  List,
  Modal,
  Portal,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
  TouchableRipple,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../Button";
import { useKeyboardHeight } from "../KeyboardAwareModal";
import FiFeMap from "../mapView/FiFeMap";
import { Marker } from "../mapView/mapView";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

/**
 * The form. One input is enough to ask something; everything else sits in a collapsed
 * accordion. Mounted only while the sheet is open, so every opening starts from a clean form.
 */
const NewRequestForm = ({ initialTitle }: { initialTitle: string }) => {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const uid = useSelector((state: RootState) => state.user.uid);
  const { myLocation } = useMyLocation();

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<ExpoImagePicker.ImagePickerAsset[]>([]);
  const [circle, setCircle] = useState<CircleType | undefined>(undefined);
  const [radius, setRadius] = useState<number>(DEFAULT_REQUEST_RADIUS);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length >= REQUEST_LIMITS.titleMin && !saving;
  const selectedLocation = circle?.location ?? myLocation?.coords;
  // Tell the user the extras were filled in even while the accordion is folded.
  const extras = [
    description.trim() && "leírás",
    images.length > 0 && `${images.length} kép`,
    circle && "hely",
    tags.length > 0 && `${tags.length} kulcsszó`,
  ].filter(Boolean) as string[];

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
      setImages((prev) => [...prev, ...result.assets].slice(0, REQUEST_LIMITS.imagesMax));
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
          // The chosen circle alone, never the GPS fallback that centres the map preview:
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
            title: error?.message?.includes("nyitott kérésed")
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
        hasDescription: !!description.trim(),
        images: countBucket(images.length),
        tags: countBucket(tags.length),
      });
      dispatch(closeRequestComposer());
      router.push({ pathname: "/kerelmek/[id]", params: { id: created.id } });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <View
        style={{
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.sm,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          borderRadius: BorderRadius.full,
          backgroundColor: theme.colors.secondaryContainer,
        }}
      >
        <Icon source="hand-heart-outline" size={18} color={theme.colors.onSecondaryContainer} />
        <ThemedText
          variant="labelLarge"
          type="bold"
          style={{ color: theme.colors.onSecondaryContainer }}
        >
          Új kérés
        </ThemedText>
      </View>

      <View style={{ gap: Spacing.xs }}>
        <ThemedText type="title" style={{ fontFamily: "Piazzolla-ExtraBold", fontSize: 28, lineHeight: 34 }}>
          Miben segítsen a közösség?
        </ThemedText>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Elég egy mondat. A részleteket később is hozzáadhatod.
        </Text>
      </View>

      <TextInput
        testID="request-title"
        mode="outlined"
        autoFocus
        value={title}
        onChangeText={setTitle}
        maxLength={REQUEST_LIMITS.titleMax}
        placeholder="pl. kertészt keresek Újpesten"
        returnKeyType="done"
        onSubmitEditing={save}
        left={<TextInput.Icon icon="magnify" />}
        outlineStyle={{ borderRadius: BorderRadius.full, borderWidth: 2 }}
        style={{ backgroundColor: theme.colors.surface }}
      />

      <List.Accordion
        testID="request-details"
        title="További részletek"
        description={extras.length ? extras.join(", ") : "Leírás, képek, hely, kulcsszavak"}
        left={(props) => <List.Icon {...props} icon="tune-variant" />}
        style={{ backgroundColor: "transparent", paddingHorizontal: 0 }}
        titleStyle={{ fontFamily: "RedHatText-Bold" }}
      >
        <View style={{ gap: Spacing.lg, paddingBottom: Spacing.md }}>
          <TextInput
            testID="request-description"
            mode="outlined"
            label="Leírás"
            value={description}
            multiline
            numberOfLines={3}
            maxLength={REQUEST_LIMITS.descriptionMax}
            onChangeText={setDescription}
          />

          <View style={{ gap: Spacing.sm }}>
            <ThemedText type="bold">Képek</ThemedText>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm }}>
              {images.map((image, index) => (
                <View key={image.uri} style={{ width: 72, height: 72 }}>
                  <Image
                    source={{ uri: image.uri }}
                    style={{ width: 72, height: 72, borderRadius: BorderRadius.md }}
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
                    width: 72,
                    height: 72,
                    borderRadius: BorderRadius.md,
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: theme.colors.outline,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon source="image-plus" size={26} color={theme.colors.primary} />
                </TouchableRipple>
              )}
            </View>
          </View>

          <View style={{ gap: Spacing.sm }}>
            <ThemedText type="bold">Hol kell a segítség?</ThemedText>
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
            {circle && (
              <>
                <View style={{ borderRadius: BorderRadius.md, overflow: "hidden", height: 140 }}>
                  <FiFeMap
                    zoomControlEnabled={false}
                    initialCamera={{ center: selectedLocation || undefined }}
                    style={{ width: "100%", height: 140 }}
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
            )}
          </View>

          <View style={{ gap: Spacing.xs }}>
            <ThemedText type="bold">Kulcsszavak</ThemedText>
            <TagInput
              placeholder="Új kulcsszó…"
              onChange={(next) => setTags(next.slice(0, REQUEST_LIMITS.tagsMax))}
              value={tags}
              suggest
            />
            <HelperText type="info" visible style={{ paddingLeft: 0 }}>
              Ezek alapján találnak rád azok, akik tudnak segíteni.
            </HelperText>
          </View>
        </View>
      </List.Accordion>

      <Button
        testID="request-submit"
        mode="contained"
        icon="send"
        disabled={!canSubmit}
        loading={saving}
        onPress={save}
        style={{ borderRadius: BorderRadius.full }}
        contentStyle={{ height: 52 }}
        labelStyle={{ fontFamily: "RedHatText-Bold" }}
      >
        Kérés közzététele
      </Button>

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
    </>
  );
};

/**
 * "Új kérés": a bottom sheet, opened from anywhere with openRequestComposer(). Mounted once at
 * the root, so a screen only has to dispatch.
 */
export const NewRequestSheet = () => {
  const dispatch = useDispatch();
  const uid = useSelector((state: RootState) => state.user.uid);
  const { open, initialTitle } = useSelector((state: RootState) => state.requests.composer);
  const { bottom } = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const { height: windowHeight } = useWindowDimensions();

  if (!uid) return null;

  const close = () => dispatch(closeRequestComposer());

  return (
    <Portal>
      <Modal
        visible={open}
        onDismiss={close}
        // Paper keeps its modal clear of the bottom safe area, which would leave a gap under
        // the sheet: the sheet pads for the inset (or the keyboard) itself instead.
        style={{ marginBottom: 0, justifyContent: "flex-end" }}
        contentContainerStyle={{ margin: 0 }}
      >
        <Surface
          testID="new-request-sheet"
          elevation={1}
          style={{
            borderTopLeftRadius: BorderRadius.xl * 2,
            borderTopRightRadius: BorderRadius.xl * 2,
            maxHeight: windowHeight * 0.92,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 48,
              height: 5,
              borderRadius: BorderRadius.full,
              marginTop: Spacing.md,
              backgroundColor: "#7F7F7F55",
            }}
          />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              gap: Spacing.lg,
              padding: Spacing.xl,
              paddingBottom: Spacing.xl + Math.max(bottom, keyboardHeight),
            }}
          >
            <NewRequestForm initialTitle={initialTitle} />
          </ScrollView>
        </Surface>
      </Modal>
    </Portal>
  );
};

export default NewRequestSheet;
