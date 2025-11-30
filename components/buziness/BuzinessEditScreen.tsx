import MapSelector from "@/components/MapSelector/MapSelector";
import { MapLocationType } from "@/components/MapSelector/MapSelector.types";
import { containerStyle } from "@/components/styles";
import TagInput from "@/components/TagInput";
import { useMyLocation } from "@/hooks/useMyLocation";
import locationToCoords from "@/lib/functions/locationToCoords";
import {
  addDialog,
  clearOptions,
  hideLoading,
  setOptions,
  showLoading,
} from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { ImageDataType, UserState } from "@/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import {
  Card,
  Divider,
  Headline,
  Icon,
  IconButton,
  MD3DarkTheme,
  Modal,
  Portal,
  Text,
  TextInput,
  TouchableRipple,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { Circle, MapView, Marker } from "../mapView/mapView";
import { ThemedView } from "../ThemedView";
import { setLocationError } from "@/redux/reducers/userReducer";
import {
  Dropdown,
  DropdownInputProps,
  Option,
} from "react-native-paper-dropdown";
import typeToIcon from "@/lib/functions/typeToIcon";
import { ThemedText } from "../ThemedText";
import BuzinessImageUpload, {
  BuzinessImageUploadHandle,
} from "./BuzinessImageUpload";
import getImagesUrlFromSupabase from "@/lib/functions/getImagesUrlFromSupabase";
import { Image } from "expo-image";
import NewMarkerIcon from "@/assets/images/newMarkerIcon";
import BuzinessItem from "./BuzinessItem";
import { Button } from "../Button";

interface NewBuzinessInterface {
  title: string;
  description: string;
}
interface BuzinessEditScreenProps {
  editId?: number;
}

export default function BuzinessEditScreen({
  editId,
}: BuzinessEditScreenProps) {
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const [categories, setCategories] = useState("");
  const [newBuziness, setNewBuziness] = useState<NewBuzinessInterface>({
    title: "",
    description: "",
  });
  const [myContacts, setMyContacts] = useState<Option[]>([]);
  const [defaultContact, setDefaultContact] = useState<number | undefined>();

  const [images, setImages] = useState<ImageDataType[]>([]);
  const imagesUploadRef = useRef<BuzinessImageUploadHandle | null>(null);
  const { myLocation, locationError } = useMyLocation();
  const [circle, setCircle] = useState<MapLocationType | undefined>(undefined);
  const selectedLocation = circle?.location || myLocation?.coords;
  const selectedAddress = "";
  const [loading, setLoading] = useState(false);

  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(true);
  const [locationTutorialVisible, setLocationTutorialVisible] = useState(false);

  const title = newBuziness.title + " $ " + categories;
  const navigation = useNavigation();

  const canSubmit = !!(
    newBuziness.title &&
    categories &&
    newBuziness.description
  );
  useEffect(() => {
    console.log("images", images);
  }, [images]);
  const save = useCallback(async () => {
    setLoading(true);
    if (!uid) return;

    console.log(selectedLocation);

    supabase.functions
      .invoke("create-buziness", {
        body: {
          id: editId,
          ...newBuziness,
          title,
          author: uid,
          location: selectedLocation
            ? `POINT(${selectedLocation?.longitude} ${selectedLocation?.latitude})`
            : null,
          defaultContact,
        },
      })
      .then(async (res) => {
        console.log(res, images.length, editId);
        if (images.length && editId) {
          const newImages = await imagesUploadRef.current?.uploadImages(editId);
          console.log("uploadRes", newImages);
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
              .eq("id", editId)
              .then((res) => {
                console.log("images upsert", res);
              });

          //return images.filter((i, ind) => i && imagesRes?.[ind]?.error);
        }
        setLoading(false);
        if (res.error) {
          console.log(res.error);
          return;
        }
        setCategories("");
        setNewBuziness({
          title: "",
          description: "",
        });
        setCircle(undefined);
        console.log(res);
        router.navigate("/user");
      });
  }, [defaultContact, editId, images.length, newBuziness, selectedLocation, title, uid]);

  useEffect(() => {
    if (circle) {
      setMapModalVisible(false);
    }
  }, [circle]);
  useEffect(() => {
    dispatch(
      setOptions([
        {
          title: "Mentés",
          icon: "content-save",
          disabled: !canSubmit || loading,
          onPress: async () => {
            dispatch(
              showLoading({
                dismissable: false,
                title: "Kérlek várj, amíg a bizniszed feltöltődik",
              }),
            );
            await save();
            dispatch(hideLoading());
          },
          theme: {
            colors: {primary:"red"}
          }
        },
      ]),
    );
    return () => {
      dispatch(clearOptions());
    };
  }, [canSubmit, dispatch, save, loading]);

  useFocusEffect(
    useCallback(() => {
      if (editId && uid) {
        navigation.setOptions({ title: "Biznisz szerkesztése" });
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
                  .reduce((partialSum, a) => partialSum + " $ " + a, "") +
                " $ ",
              );
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
                });
              }
            }
          });
        supabase
          .from("contacts")
          .select("id, data")
          .eq("author", uid)
          .then((res) => {
            if (res.data) {
              setMyContacts(
                res.data.map((contact) => {
                  return {
                    label: contact.data,
                    value: contact.id.toString(),
                  };
                }),
              );
            }
          });
      }

      return () => {
        console.log("This route is now unfocused.");
      };
    }, [editId, navigation, uid]),
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{}}>
        {tutorialVisible && (
          <Card
            mode="elevated"
            style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
          >
            <Card.Title
              title={"Mihez értesz?"}
              right={() => (
                <IconButton
                  icon="close"
                  onPress={() => setTutorialVisible(false)}
                />
              )}
            />
            <Card.Content>
              {tutorialVisible && (
                <Text>
                  Ezen az oldalon fel tudsz venni egy új bizniszt a profilodba.
                  {"\n"}A te bizniszeid azon hobbijaid, képességeid vagy
                  szakmáid listája, amelyeket meg szeretnél osztani másokkal is.{" "}
                  {"\n"}Ha, mondjuk, futószalagon gyártod a sütiket, és
                  ezt felveszed a bizniszeid közé, a Biznisz oldalon
                  megtalálható leszel a süti kulcsszóval.
                </Text>
              )}
            </Card.Content>
          </Card>
        )}
        <View style={{}}>
          <TextInput
            placeholder="Bizniszem neve"
            value={newBuziness.title}
            onChangeText={(t) => setNewBuziness({ ...newBuziness, title: t })}
          />
          <TagInput
            placeholder="Kategóriák, nyomj entert a hozzáadásukhoz"
            onChange={setCategories}
            value={categories}
          />
          <TextInput
            placeholder="Fejtsd ki bővebben"
            value={newBuziness.description}
            multiline
            onChangeText={(t) =>
              setNewBuziness({ ...newBuziness, description: t })
            }
          />
          <Dropdown
            label="Kiemelt elérhetőséged"
            options={myContacts}
            value={defaultContact?.toString()}
            CustomDropdownInput={({
              placeholder,
              selectedLabel,
              label,
              rightIcon,
            }: DropdownInputProps) => (
              <TextInput
                placeholder={placeholder}
                label={label}
                value={selectedLabel}
                right={rightIcon}
              />
            )}
            CustomDropdownItem={({
              width,
              option,
              value,
              onSelect,
              toggleMenu,
              isLast,
            }) => {
              return (
                <>
                  <TouchableRipple
                    onPress={() => {
                      onSelect?.(option.value);
                      toggleMenu();
                    }}
                  >
                    <Headline
                      style={{
                        color:
                          value === option.value
                            ? MD3DarkTheme.colors.onPrimary
                            : MD3DarkTheme.colors.primary,
                        alignItems: "center",
                        display: "flex",
                        padding: 8,
                      }}
                    >
                      <Icon source={typeToIcon(option.value)} size={22} />
                      <ThemedText style={{ marginLeft: 8 }}>
                        {option.label}
                      </ThemedText>
                    </Headline>
                  </TouchableRipple>
                  {!isLast && <Divider />}
                </>
              );
            }}
            hideMenuHeader
            onSelect={(e) => {
              setDefaultContact(Number(e));
            }}
          />
          <BuzinessImageUpload
            images={images}
            setImages={setImages}
            buzinessId={editId}
            ref={imagesUploadRef}
          />
          {!!circle && (
            <View
              style={{
                flexDirection: "row",
                flexWrap:"wrap",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 8,
              }}
            >
              <ThemedText>A bizniszed helyzete</ThemedText>
              <Button onPress={() => setMapModalVisible(true)} mode="contained">
                Környék módosítása
              </Button>
            </View>
          )}
          <View style={{ minHeight: circle ? 300 : 100 }}>
            {circle ? (
              <MapView
                // @ts-expect-error options error
                options={{
                  mapTypeControl: false,
                  fullscreenControl: false,
                  streetViewControl: false,
                }}
                zoomControlEnabled={false}
                initialCamera={{
                  altitude: 10,
                  center: selectedLocation ||
                    myLocation?.coords || {
                    latitude: 47.4979,
                    longitude: 19.0402,
                  },
                  heading: 0,
                  pitch: 0,
                  zoom: 12,
                }}
                style={{}}
                provider="google"
                googleMapsApiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}
                pitchEnabled={false}
                rotateEnabled={false}
                toolbarEnabled={false}
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
              </MapView>
            ) : (
              <View style={{ alignItems: "center", gap: 8, padding: 16 }}>
                <Image
                  style={{ width: 100, height: 100 }}
                  source={require("@/assets/images/img-map.png")}
                />
                <ThemedText type="subtitle">
                  Találjanak meg a helyiek
                </ThemedText>
                <Button
                  onPress={() => setMapModalVisible(true)}
                  mode={"contained-tonal"}
                >
                  Válassz környéket
                </Button>
              </View>
            )}
          </View>
        </View>
        <ThemedView
          type="default"
          style={{
            padding: 8,
            bottom: 0,
            width: "100%",
            gap:16
          }}
        >
          <ThemedText>Így fog megjelenni a bizniszed:</ThemedText>
          <BuzinessItem
            data={{
              title: ((newBuziness.title||"A biznisz címe") + (categories ? " $ " + categories : " $ Egy kategória $ Egy másik kategória")),
              description: newBuziness.description || "Hosszabb leírás hogy miről szól a bizniszed.",
              images: images,
              location: circle
                ? `POINT(${circle.location.longitude} ${circle.location.latitude})`
                : null,
              defaultContact,
              recommendations: 0,
            }}
          />
          <View style={{alignItems:"flex-end"}}>
            <Button mode="contained" onPress={save}>Mentés</Button>
          </View>
        </ThemedView>
        <Portal>
          <Modal
            visible={mapModalVisible}
            onDismiss={() => {
              setMapModalVisible(false);
            }}
            contentContainerStyle={{}}
            dismissableBackButton
          >
            <ThemedView style={[{ flex: 1, padding: 16 }]}>
              <MapSelector
                data={circle}
                setData={setCircle}
                setOpen={setMapModalVisible}
                searchEnabled
                title="Találjanak meg a helyiek!"
                text="Ha fontos a földrajzi helyzete a bizniszednek, itt megadhatod tetszőleges pontossággal."
              />
            </ThemedView>
          </Modal>
        </Portal>
      </ScrollView>
    </ThemedView>
  );
}
