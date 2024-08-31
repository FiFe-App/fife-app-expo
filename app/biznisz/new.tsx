import MapSelector from "@/components/MapSelector/MapSelector";
import { MapCircleType } from "@/components/MapSelector/MapSelector.types";
import { containerStyle } from "@/components/styles";
import TagInput from "@/components/TagInput";
import { useMyLocation } from "@/hooks/useMyLocation";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  Button,
  Icon,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { useSelector } from "react-redux";

interface NewBuzinessInterface {
  title: string;
  description: string;
}

export default function Index() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const [categories, setCategories] = useState("");
  const [newBuziness, setNewBuziness] = useState<NewBuzinessInterface>({
    title: "",
    description: "",
  });
  const { myLocation, error: locationError } = useMyLocation();
  const [circle, setCircle] = useState<MapCircleType | undefined>(undefined);
  const newPoint = `POINT(${circle?.position.latitude || myLocation?.coords.latitude} ${circle?.position.longitude || myLocation?.coords.longitude})`;
  const [loading, setLoading] = useState(false);

  const [mapModalVisible, setMapModalVisible] = useState(false);

  const title = newBuziness.title.trim() + " " + categories.trim();
  const canSubmit =
    (!!myLocation || !!circle) &&
    newBuziness.title &&
    categories &&
    newBuziness.description;

  useEffect(() => {
    if (circle) {
      setMapModalVisible(false);
    }
  }, [circle]);

  const save = () => {
    setLoading(true);
    if (!uid) return;

    supabase
      .from("buziness")
      .upsert({
        ...newBuziness,
        title,
        author: uid,
        location: newPoint,
      })
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
        router.navigate("user");
      });
  };
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
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
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            {!!locationError && (
              <Text>
                <Icon size={16} source="map-marker-question" />
                {locationError}
              </Text>
            )}
            {!!circle ? (
              <Text>
                <Icon size={16} source="map-marker-account" />
                Keresés meghatározott terület alapján.
              </Text>
            ) : (
              !!myLocation && (
                <Text>
                  <Icon size={16} source="map-marker" />
                  Keresés jelenlegi helyzeted alapján.
                </Text>
              )
            )}
          </View>
          <Button onPress={() => setMapModalVisible(true)}>
            {!!circle ? "Környék kiválasztva" : "Válassz környéket"}
          </Button>
        </View>
      </View>

      <Button
        onPress={save}
        loading={loading}
        style={{ margin: 4 }}
        mode="elevated"
        disabled={!canSubmit}
      >
        <Text>Feltöltöm</Text>
      </Button>
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
    </View>
  );
}
