import MapSelector from "@/components/MapSelector/MapSelector";
import containerStyle from "@/components/styles";
import TagInput from "@/components/TagInput";
import { useMyLocation } from "@/hooks/useMyLocation";
import locationToCoords from "@/lib/functions/locationToCoords";
import {
  addSnack,
  hideLoading,
  showLoading,
} from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { CircleType, ImageDataType, UserState } from "@/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Dialog,
  HelperText,
  Icon,
  IconButton,
  Modal,
  Portal,
  SegmentedButtons,
  Surface,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { Marker } from "../mapView/mapView";
import FiFeMap from "../mapView/FiFeMap";
import { ThemedView } from "../ThemedView";
import BuzinessImageUpload, {
  BuzinessImageUploadHandle,
} from "./BuzinessImageUpload";
import getImagesUrlFromSupabase from "@/lib/functions/getImagesUrlFromSupabase";
import NewMarkerIcon from "@/assets/images/newMarkerIcon";
import BuzinessItem from "./BuzinessItem";
import { Button } from "../Button";
import ContactEditScreen from "./ContactEditScreen";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { Tables } from "@/database.types";
import { useAppTheme } from "@/assets/theme";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import SectionLabel from "./SectionLabel";

interface NewBuzinessInterface {
  title: string;
  description: string;
}
interface BuzinessEditScreenProps {
  editId?: number;
}

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
const DEFAULT_RADIUS = 20;

export default function BuzinessEditScreen({
  editId,
}: BuzinessEditScreenProps) {
  const theme = useAppTheme();
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const [categories, setCategories] = useState<string[]>([]);
  const [newBuziness, setNewBuziness] = useState<NewBuzinessInterface>({
    title: "",
    description: "",
  });
  const [contacts, setContacts] = useState<Optional<Tables<"contacts">, "id">[]>(
    [],
  );
  const [defaultContact, setDefaultContact] = useState<number | undefined>();

  const [ingyen, setIngyen] = useState(false);
  const [images, setImages] = useState<ImageDataType[]>([]);
  const imagesUploadRef = useRef<BuzinessImageUploadHandle | null>(null);
  const contactEditRef = useRef<{
    saveContacts: () => Promise<
      | PostgrestSingleResponse<unknown>
      | {
          error: string;
        }
      | undefined
    >;
    getContacts: () => Optional<Tables<"contacts">, "id">[];
  }>(null);
  const { myLocation } = useMyLocation();
  const [circle, setCircle] = useState<CircleType | undefined>(undefined);
  const selectedLocation = circle?.location || myLocation?.coords;
  const [loading, setLoading] = useState(false);

  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const title = [newBuziness.title, ...categories].join(" $ ");
  const hasContact = contacts.some(
    (c) => !!c && !!c.data && c.data.length > 0,
  );
  const canSubmit = !!(
    newBuziness.title &&
    categories.length > 0 &&
    newBuziness.description &&
    hasContact
  );

  const save = useCallback(async () => {
    setLoading(true);
    if (!uid) return;

    const contactResponse = await contactEditRef.current?.saveContacts();

    if (contactResponse?.error) {
      dispatch(
        addSnack({
          title:
            "Hiba az elérhetőségek mentése során. Ellenőrizd a mezőket.",
        }),
      );
      setLoading(false);
      return;
    }

    const contactsCheck = await supabase
      .from("contacts")
      .select("id")
      .eq("author", uid);

    if (!contactsCheck.data || contactsCheck.data.length === 0) {
      dispatch(
        addSnack({
          title:
            "Legalább egy elérhetőséget kötelező megadni a biznisz létrehozásához.",
        }),
      );
      setLoading(false);
      return;
    }

    await supabase.functions
      .invoke("create-buziness", {
        body: {
          id: editId,
          ...newBuziness,
          title,
          ingyen,
          author: uid,
          location: selectedLocation
            ? `POINT(${selectedLocation?.longitude} ${selectedLocation?.latitude})`
            : null,
          defaultContact,
        },
      })
      .then(async (res) => {
        const buzinessId = editId ?? res.data?.id;
        if (images.length && buzinessId) {
          const newImages = await imagesUploadRef.current?.uploadImages(
            buzinessId,
          );
          if (uid && newImages)
            await supabase
              .from("buziness")
              .update({
                author: uid,
                images: newImages
                  .filter((i) => i.status !== "toDelete")
                  .map((i) =>
                    JSON.stringify({
                      description: i.description,
                      path: i.path,
                    }),
                  ) as string[],
              })
              .eq("id", buzinessId);
        }
        setLoading(false);
        if (res.error) {
          dispatch(
            addSnack({ title: "Hiba történt a biznisz mentése során." }),
          );
          return;
        }
        router.navigate("/user");
      });
  }, [
    defaultContact,
    dispatch,
    editId,
    images.length,
    ingyen,
    newBuziness,
    selectedLocation,
    title,
    uid,
  ]);

  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const loadContacts = useCallback(() => {
    if (!uid) return;
    supabase
      .from("contacts")
      .select("*")
      .eq("author", uid)
      .then((res) => {
        if (res.data) {
          setContacts(res.data as Optional<Tables<"contacts">, "id">[]);
        }
      });
  }, [uid]);

  const handleSavePress = useCallback(async () => {
    dispatch(
      showLoading({
        dismissable: false,
        title: "Kérlek várj, amíg a bizniszed feltöltődik",
      }),
    );
    await saveRef.current();
    dispatch(hideLoading());
    loadContacts();
  }, [dispatch, loadContacts]);

  useFocusEffect(
    useCallback(() => {
      if (editId && uid) {
        supabase
          .from("buziness")
          .select("*")
          .eq("id", editId)
          .then((res) => {
            const editingBuziness = res?.data?.[0];

            if (editingBuziness?.author !== uid) return;
            if (editingBuziness) {
              setNewBuziness({
                title: editingBuziness.title.split(" $ ")[0],
                description: editingBuziness.description,
              });

              setCategories(
                editingBuziness.title
                  .split(" $ ")
                  .slice(1)
                  .filter(Boolean),
              );
              setIngyen(!!editingBuziness.ingyen);
              if (editingBuziness.defaultContact)
                setDefaultContact(editingBuziness.defaultContact);
              if (editingBuziness.images)
                setImages(getImagesUrlFromSupabase(editingBuziness.images));
              if (editingBuziness.location) {
                const cords = locationToCoords(
                  String(editingBuziness.location),
                );

                setCircle({
                  location: { latitude: cords[1], longitude: cords[0] },
                  radius: editingBuziness.radius || DEFAULT_RADIUS,
                });
              }
            }
          });
      }
      loadContacts();
    }, [editId, uid, loadContacts]),
  );

  const surfaceStyle = {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  };

  return (
    <>
      <Stack.Screen
        options={{ title: editId ? "Biznisz szerkesztése" : "Új Biznisz" }}
      />
      <ThemedView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: Spacing.md,
            paddingTop: Spacing.lg,
            paddingBottom: Spacing.xxl,
            gap: Spacing.lg,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.sm,
              paddingHorizontal: Spacing.xs,
            }}
          >
            <Text
              variant="bodyMedium"
              style={{ flex: 1, color: theme.colors.onSurfaceVariant }}
            >
              Oszd meg, miben tudsz másoknak segíteni.
            </Text>
            <IconButton
              icon="help-circle-outline"
              size={22}
              onPress={() => setHelpVisible(true)}
              accessibilityLabel="Mi ez az oldal?"
            />
          </View>

          <View style={{ gap: Spacing.sm }}>
            <SectionLabel label="Alapadatok" />
            <Surface elevation={1} style={surfaceStyle}>
              <TextInput
                mode="outlined"
                label="Biznisz neve *"
                value={newBuziness.title}
                onChangeText={(t) =>
                  setNewBuziness({ ...newBuziness, title: t })
                }
              />
              <TextInput
                mode="outlined"
                label="Leírás *"
                value={newBuziness.description}
                multiline
                numberOfLines={4}
                onChangeText={(t) =>
                  setNewBuziness({ ...newBuziness, description: t })
                }
              />
            </Surface>
          </View>

          <View style={{ gap: Spacing.sm }}>
            <SectionLabel label="Kulcsszavak" required />
            <Surface elevation={1} style={surfaceStyle}>
              <TagInput
                placeholder="Új kulcsszó…"
                onChange={setCategories}
                value={categories}
              />
              <HelperText type="info" visible style={{ paddingLeft: 0 }}>
                Pl. süti, kerékpár, programozás
              </HelperText>
            </Surface>
          </View>

          <View style={{ gap: Spacing.sm }}>
            <SectionLabel label="Elérhetőségek" required />
            <Surface elevation={1} style={surfaceStyle}>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Töltsd ki azt, ahol elérhetnek. A csillaggal jelölheted a
                legfontosabbat.
              </Text>
              <ContactEditScreen
                ref={contactEditRef}
                onContactsChange={(newContacts) => setContacts(newContacts)}
                defaultContactId={defaultContact}
                onDefaultContactChange={setDefaultContact}
                showFeaturedToggle
              />
            </Surface>
            {!hasContact && (
              <HelperText
                type="error"
                visible
                style={{ paddingLeft: Spacing.xs }}
              >
                Legalább egy elérhetőség megadása kötelező.
              </HelperText>
            )}
          </View>

          <View style={{ gap: Spacing.sm }}>
            <SectionLabel label="Hol érhető el a bizniszed?" />
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
                <View
                  style={{
                    borderRadius: BorderRadius.md,
                    overflow: "hidden",
                    height: 200,
                  }}
                >
                  <FiFeMap
                    zoomControlEnabled={false}
                    initialCamera={{
                      center:
                        selectedLocation || myLocation?.coords || undefined,
                    }}
                    style={{ width: "100%", height: 200 }}
                    moveOnMarkerPress
                  >
                    {(!!selectedLocation || !!myLocation) && (
                      <Marker
                        coordinate={
                          selectedLocation ||
                          myLocation?.coords || {
                            latitude: 47.4979,
                            longitude: 19.0402,
                          }
                        }
                        anchor={{ x: 0.5, y: 0.5 }}
                      >
                        <NewMarkerIcon width={24} height={24} />
                      </Marker>
                    )}
                  </FiFeMap>
                </View>
              ) : (
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  A bizniszed bárhonnan elérhető — nincs földrajzi helyhez
                  kötve.
                </Text>
              )}
              {circle && (
                <Button
                  mode="contained-tonal"
                  onPress={() => setMapModalVisible(true)}
                >
                  Környék módosítása
                </Button>
              )}
            </Surface>
          </View>

          <View style={{ gap: Spacing.sm }}>
            <SectionLabel label="Képek" optional />
            <Surface elevation={1} style={surfaceStyle}>
              <BuzinessImageUpload
                images={images}
                setImages={setImages}
                buzinessId={editId}
                ref={imagesUploadRef}
              />
            </Surface>
          </View>

          <View style={{ gap: Spacing.sm }}>
            <SectionLabel label="Beállítások" />
            <Surface elevation={1} style={surfaceStyle}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.md,
                }}
              >
                <Icon
                  source="charity"
                  size={24}
                  color={theme.colors.primary}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyMedium">Ingyenes / önkéntes biznisz</Text>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Jelöld be, ha ingyenesen vagy önkéntesen végzed.
                  </Text>
                </View>
                <Switch
                  value={ingyen}
                  onValueChange={setIngyen}
                  color={theme.colors.nature}
                />
              </View>
            </Surface>
          </View>

          <View style={{ gap: Spacing.sm }}>
            <SectionLabel label="Így fog megjelenni" />
            <BuzinessItem
              preview
              data={{
                id: editId || 0,
                author: uid || "",
                title:
                  (newBuziness.title || "A biznisz címe") +
                  (categories.length
                    ? " $ " + categories.join(" $ ")
                    : " $ Egy kategória $ Egy másik kategória"),
                description:
                  newBuziness.description ||
                  "Hosszabb leírás hogy miről szól a bizniszed.",
                images: images,
                location: circle
                  ? `POINT(${circle.location.longitude} ${circle.location.latitude})`
                  : null,
                recommendations: 0,
              }}
            />
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
            mode="contained"
            icon="check-bold"
            disabled={!canSubmit || loading}
            onPress={handleSavePress}
            style={{ flex: 1, borderRadius: BorderRadius.lg }}
            contentStyle={{ height: 56 }}
            labelStyle={{ fontFamily: "RedHatText-Bold" }}
          >
            Mentés
          </Button>
        </Surface>

        <Portal>
          <Modal
            visible={mapModalVisible}
            onDismiss={() => setMapModalVisible(false)}
            style={{ alignItems: "center" }}
            contentContainerStyle={[
              {
                width: "90%",
                height: "90%",
              },
            ]}
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

          <Dialog
            visible={helpVisible}
            onDismiss={() => setHelpVisible(false)}
          >
            <Dialog.Title>Mihez értesz?</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">
                Ezen az oldalon fel tudsz venni egy új bizniszt a profilodba.
                {"\n\n"}A te bizniszeid azon hobbijaid, képességeid vagy
                szakmáid listája, amelyeket meg szeretnél osztani másokkal is.
                {"\n\n"}Ha, mondjuk, futószalagon gyártod a sütiket, és ezt
                felveszed a bizniszeid közé, a Biznisz oldalon megtalálható
                leszel a süti kulcsszóval.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setHelpVisible(false)}>Értem</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ThemedView>
    </>
  );
}
