import { useAppTheme } from "@/assets/theme";
import NewMarkerIcon from "@/assets/images/newMarkerIcon";
import MapSelector from "@/components/MapSelector/MapSelector";
import containerStyle from "@/components/styles";
import TagInput from "@/components/TagInput";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { useComposerBack } from "@/hooks/useComposerBack";
import { useMyLocation } from "@/hooks/useMyLocation";
import { countBucket, trackEvent } from "@/lib/analytics";
import { uploadRequestImages } from "@/lib/requests/requestImages";
import {
  REQUEST_LIMITS,
} from "@/lib/requests/types";
import { invokeFunction } from "@/lib/supabase/invokeFunction";
import { supabase } from "@/lib/supabase/supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { addSnack } from "@/redux/reducers/infoReducer";
import { closeRequestComposer } from "@/redux/reducers/requestsReducer";
import { RootState } from "@/redux/store";
import { CircleType } from "@/redux/store.type";
import { Image } from "expo-image";
import * as ExpoImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import {
  HelperText,
  Divider,
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
import { KeyboardAwareModal, useKeyboardHeight } from "../KeyboardAwareModal";
import { modalContainerStyle } from "../ModalCard";
import FiFeMap from "../mapView/FiFeMap";
import { Marker } from "../mapView/mapView";
import ProfileImage from "../ProfileImage";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

// An accordion's header keeps the dialog's side padding; its content does not: it is as wide as
// the dialog. Paper gives an accordion's children a paddingLeft of its own (40) that beats
// paddingHorizontal, so the left side is set explicitly to take the indent away.
const accordionHeaderStyle = { backgroundColor: "transparent", paddingHorizontal: Spacing.md };
const accordionContentStyle = {
  gap: Spacing.lg,
  paddingLeft: Spacing.sm,
  paddingRight: Spacing.sm,
  paddingBottom: Spacing.md,
};

/** The "at most 10 open requests" message the function passes on in words for the user. */
async function limitMessage(error: unknown): Promise<string | null> {
  if (!(error instanceof FunctionsHttpError)) return null;
  try {
    const body = await error.context.json();
    return typeof body?.error === "string" && body.error.includes("nyitott kérésed")
      ? body.error
      : null;
  } catch {
    return null;
  }
}

/**
 * The form. One input is enough to ask something; everything else sits in a collapsed
 * accordion. Mounted only while the sheet is open, so every opening starts from a clean form.
 */
/** The title shows in full, up to this many lines (it is one line unless the text needs more). */
const TITLE_MAX_LINES = 7;
/** Paper's outlined, dense input: the room above and below its text. */
const TITLE_VERTICAL_PADDING = 16;
/** The room left and right of the text inside the input (kept a little over, so a line is never lost). */
const TITLE_HORIZONTAL_PADDING = 18;

const NewRequestForm = ({
  initialTitle,
  dismiss,
  keepVisible,
}: {
  initialTitle: string;
  /** Closes the modal (the same way the Back button does) and resolves once it is gone. */
  dismiss: () => Promise<void>;
  /** Scrolls the sheet so that the given (growing) field stays in view above the keyboard. */
  keepVisible: (field: View | null) => void;
}) => {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const uid = useSelector((state: RootState) => state.user.uid);
  const avatarUrl = useSelector((state: RootState) => state.user.userData?.avatar_url);
  const { myLocation } = useMyLocation();

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<ExpoImagePicker.ImagePickerAsset[]>([]);
  const [circle, setCircle] = useState<CircleType | undefined>(undefined);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titleTextHeight, setTitleTextHeight] = useState(0);
  const descriptionRef = useRef<View>(null);

  // How tall the title input is: the lines its text takes, one at least, TITLE_MAX_LINES at most.
  const titleFont = theme.fonts.bodyLarge;
  const titleLineHeight = titleFont.lineHeight ?? 24;
  const titleLines = Math.max(1, Math.round(titleTextHeight / titleLineHeight));
  const titleInputHeight =
    Math.min(titleLines, TITLE_MAX_LINES) * titleLineHeight + TITLE_VERTICAL_PADDING;

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length >= REQUEST_LIMITS.titleMin && !saving;
  const selectedLocation = circle?.location ?? myLocation?.coords;
  // What is filled in stays visible while an accordion is folded.
  const targetingSummary = [
    tags.length > 0 && `${tags.length} kulcsszó`,
    circle && "hely",
  ]
    .filter(Boolean)
    .join(", ");
  const detailsSummary = [description.trim() && "leírás", images.length > 0 && `${images.length} kép`]
    .filter(Boolean)
    .join(", ");

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
      // The row is written by the create-request function: it makes the embedding (when the
      // user's AI setting allows) that only the server may write.
      const { data: created, error } = await invokeFunction<{ id: number }>("create-request", {
        body: {
          title: trimmedTitle,
          description: description.trim(),
          tags,
          // The chosen circle alone, never the GPS fallback that centres the map preview:
          // "Bárhol" has to stay without a place.
          location: circle
            ? `POINT(${circle.location.longitude} ${circle.location.latitude})`
            : null,
        },
      });

      if (error || !created?.id) {
        console.error("Error creating request:", error);
        dispatch(
          addSnack({
            // The limit message is written for the user; anything else is not.
            title: (await limitMessage(error)) ?? "Hiba történt a kérés mentése során. Próbáld újra később.",
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
      await dismiss();
      router.push({ pathname: "/kerelmek/[id]", params: { id: created.id } });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* The same row as the prompt on the community screen it was opened from, so the field
          reads as that one, grown. */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
        <ProfileImage
          uid={uid ?? ""}
          avatar_url={avatarUrl}
          style={{ width: 40, height: 40, borderRadius: BorderRadius.md }}
        />
        <View style={{ flex: 1 }}>
          <TextInput
            testID="request-title"
            mode="outlined"
            autoFocus
            value={title}
            onChangeText={setTitle}
            maxLength={REQUEST_LIMITS.titleMax}
            placeholder="Kell valamiben segítség?"
            multiline
            // One line to begin with; as tall as the text needs, up to TITLE_MAX_LINES, after
            // that it scrolls.
            scrollEnabled={titleLines > TITLE_MAX_LINES}
            dense
            outlineStyle={{ borderRadius: BorderRadius.xl, borderWidth: 1 }}
            style={{ height: titleInputHeight, backgroundColor: theme.colors.background }}
          />
          {/* The same text, laid out invisibly at the input's width: its height is how many
              lines the title takes, whatever the platform does with a multiline input. */}
          <Text
            testID="request-title-mirror"
            aria-hidden
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            onLayout={(e) => setTitleTextHeight(e.nativeEvent.layout.height)}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              opacity: 0,
              paddingHorizontal: TITLE_HORIZONTAL_PADDING,
              fontFamily: titleFont.fontFamily,
              fontSize: titleFont.fontSize,
              lineHeight: titleLineHeight,
            }}
          >
            {title.endsWith("\n") ? `${title} ` : title || " "}
          </Text>
        </View>
      </View>

      {/* Two folded accordions, each as wide as the dialog: who should see the request
          (keywords and place), and what else to tell about it (text and pictures). */}
      <Surface elevation={1} style={{ borderRadius: BorderRadius.lg, overflow: "hidden" }}>
        <List.Accordion
          testID="request-targeting"
          title="Kiknek szeretnél üzenni?"
          description={targetingSummary || "Kulcsszavak és hely: kihez jusson el"}
          left={(props) => <List.Icon {...props} icon="target" />}
          style={accordionHeaderStyle}
          titleStyle={{ fontFamily: "RedHatText-Bold" }}
        >
          <View style={accordionContentStyle}>
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
                </>
              )}
            </View>
          </View>
        </List.Accordion>

        <Divider />

        <List.Accordion
          testID="request-details"
          title="További infók"
          description={detailsSummary || "Leírás és képek"}
          left={(props) => <List.Icon {...props} icon="text-box-plus-outline" />}
          style={accordionHeaderStyle}
          titleStyle={{ fontFamily: "RedHatText-Bold" }}
        >
          <View style={accordionContentStyle}>
            {/* The description grows with the text; the wrapper is what gets measured, so the
                last line is never left under the keyboard (or below the sheet's own edge). */}
            <View ref={descriptionRef} collapsable={false}>
              <TextInput
                testID="request-description"
                mode="outlined"
                label="Leírás"
                value={description}
                multiline
                numberOfLines={4}
                maxLength={REQUEST_LIMITS.descriptionMax}
                onChangeText={setDescription}
                onContentSizeChange={() => keepVisible(descriptionRef.current)}
                onSelectionChange={() => keepVisible(descriptionRef.current)}
              />
            </View>

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
          </View>
        </List.Accordion>
      </Surface>

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
 * "Új kérés": a centered modal on a bare backdrop (no card), opened from anywhere with openRequestComposer(). The community
 * screen's post-style prompt (RequestComposerPrompt) opens it, and the title input inside is
 * styled like that prompt, so the field reads as the same one, grown. Mounted once at the root,
 * so a screen only has to dispatch.
 */
export const NewRequestModal = () => {
  const dispatch = useDispatch();
  const uid = useSelector((state: RootState) => state.user.uid);
  const { open, initialTitle } = useSelector((state: RootState) => state.requests.composer);
  const keyboardHeight = useKeyboardHeight();
  const { height: windowHeight } = useWindowDimensions();
  const close = useCallback(() => {
    dispatch(closeRequestComposer());
  }, [dispatch]);
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  // When a field grows while typing, its bottom can slip out of the sheet's visible part (the
  // sheet sits above the keyboard and scrolls on its own): scroll just enough to show it again.
  const keepVisible = useCallback((field: View | null) => {
    const scroll = scrollRef.current;
    if (!scroll || !field) return;
    field.measureInWindow((_x, fieldY, _w, fieldHeight) => {
      scroll.measureInWindow((_sx, sheetY, _sw, sheetHeight) => {
        const margin = Spacing.md;
        const below = fieldY + fieldHeight + margin - (sheetY + sheetHeight);
        const above = sheetY - (fieldY - margin);
        if (below > 0) scroll.scrollTo({ y: scrollY.current + below, animated: false });
        else if (above > 0) scroll.scrollTo({ y: Math.max(0, scrollY.current - above), animated: false });
      });
    });
  }, []);
  // The system Back button closes the modal (and the tap on the backdrop does the same).
  const { dismiss } = useComposerBack(open, close);

  if (!uid) return null;

  // The Paper modal only renders inside a Portal (without one it never shows, on the web at
  // least). No card: the form floats on the dimmed backdrop, like a post box being opened.
  return (
    <Portal>
      <KeyboardAwareModal
        visible={open}
        onDismiss={dismiss}
        // Back is handled by useComposerBack, which also covers the browser's Back.
        dismissableBackButton={false}
        contentContainerStyle={modalContainerStyle}
      >
        <View
          testID="new-request-modal"
          style={{ width: "100%", maxWidth: 560, alignSelf: "center" }}
        >
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            onScroll={(e) => {
              scrollY.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            style={{ maxHeight: (windowHeight - keyboardHeight) * 0.9 }}
            contentContainerStyle={{ gap: Spacing.md }}
          >
            <NewRequestForm initialTitle={initialTitle} dismiss={dismiss} keepVisible={keepVisible} />
          </ScrollView>
        </View>
      </KeyboardAwareModal>
    </Portal>
  );
};

export default NewRequestModal;
