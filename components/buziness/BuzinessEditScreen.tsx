import MapSelector from "@/components/MapSelector/MapSelector";
import { MapCircleType } from "@/components/MapSelector/MapSelector.types";
import { containerStyle } from "@/components/styles";
import TagInput from "@/components/TagInput";
import { useMyLocation } from "@/hooks/useMyLocation";
import locationToCoords from "@/lib/functions/locationToCoords";
import { setOptions } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Button,
  Card,
  Icon,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { MapView, Marker } from "../mapView/mapView";
import { ThemedView } from "../ThemedView";

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
  const { myLocation, error: locationError } = useMyLocation();
  const [circle, setCircle] = useState<MapCircleType | undefined>(undefined);
  const selectedLocation = circle?.position || myLocation?.coords;
  const [loading, setLoading] = useState(false);

  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(true);
  const [locationTutorialVisible, setLocationTutorialVisible] = useState(false);

  const title = newBuziness.title + " $ " + categories;
  const navigation = useNavigation();

  const canSubmit = !!(
    (!!myLocation || !!circle) &&
    newBuziness.title &&
    categories &&
    newBuziness.description
  );
  const save = useCallback(() => {
    setLoading(true);
    if (!uid) return;

    console.log(selectedLocation);

    supabase
      .from("buziness")
      .upsert(
        {
          id: editId,
          ...newBuziness,
          title,
          author: uid,
          location: `POINT(${selectedLocation?.longitude} ${selectedLocation?.latitude})`,
        },
        { onConflict: "id" },
      )
      .then((res) => {
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
  }, [editId, newBuziness, selectedLocation, title, uid]);

  useEffect(() => {
    if (circle) {
      setMapModalVisible(false);
    }
  }, [circle]);
  useEffect(() => {
    console.log("canSubmit", canSubmit);

    dispatch(
      setOptions([
        {
          title: "Mentés",
          icon: "check",
          disabled: !canSubmit,
          onPress: save,
        },
      ]),
    );
  }, [canSubmit, dispatch, save]);

  useFocusEffect(
    useCallback(() => {
      if (editId) {
        navigation.setOptions({ title: "biznisz szerkesztése" });
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

              const cords = locationToCoords(String(editingBuziness.location));

              setCircle({
                position: { latitude: cords[1], longitude: cords[0] },
                radius: 200,
                radiusDisplay: null,
              });
            }
          });
      }

      return () => {
        console.log("This route is now unfocused.");
      };
    }, [dispatch, editId, uid]),
  );

  console.log(newBuziness);

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
                  {"\n"}Ha te mondjuk úgy gyártod a sütiket, mint egy gép, és
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
            placeholder="Kategóriái"
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
          <Card>
            <Card.Title
              title="A bizniszed helyzete:"
              right={() => (
                <IconButton
                  icon="help-circle-outline"
                  onPress={() => setLocationTutorialVisible(true)}
                />
              )}
            />
            <Card.Content>
              {locationTutorialVisible && (
                <Text>
                  A helyzet fontos, ugyanis kereséskor mindig a közelebbi
                  bizniszek jönnek először.
                </Text>
              )}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  {!!locationError && !circle && (
                    <Text>
                      <Icon size={16} source="map-marker-question" />
                      {locationError}
                    </Text>
                  )}
                  {!!circle ? (
                    <Text>
                      <Icon size={16} source="map-marker-account" />
                      Hely kiválasztva
                    </Text>
                  ) : (
                    !!myLocation && (
                      <Text>
                        <Icon size={16} source="map-marker" />
                        Jelenlegi helyzeted használata.
                      </Text>
                    )
                  )}
                </View>
                <Button onPress={() => setMapModalVisible(true)}>
                  {!!circle ? "Környék kiválasztva" : "Válassz környéket"}
                </Button>
              </View>
            </Card.Content>
          </Card>
          <View style={{ minHeight: 300 }}>
            <MapView
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
                />
              )}
            </MapView>
          </View>
        </View>
        <Portal>
          <Modal
            visible={mapModalVisible}
            onDismiss={() => {
              setMapModalVisible(false);
            }}
            contentContainerStyle={containerStyle}
          >
            <MapSelector data={circle} setData={setCircle} searchEnabled />
          </Modal>
        </Portal>
      </ScrollView>
    </ThemedView>
  );
}
