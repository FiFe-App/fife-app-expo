import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  Button,
  Icon,
  Portal,
  Text,
  TextInput,
  Modal,
} from "react-native-paper";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { useSelector } from "react-redux";
import { supabase } from "@/lib/supabase/supabase";
import TagInput from "@/components/TagInput";
import { useMyLocation } from "@/hooks/useMyLocation";
import MapSelector from "@/components/MapSelector/MapSelector";
import { MapCircleType } from "@/components/MapSelector/MapSelector.types";

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
  const [visible, setVisible] = useState(false);
  const [circle, setCircle] = useState<MapCircleType | undefined>(undefined);

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const containerStyle = {
    backgroundColor: "white",
    padding: 20,
    margin: 30,
    height: 500,
  };
  const title = newBuziness.title + " " + categories;
  useEffect(() => {
    if (circle) {
      setVisible(false);
    }
  }, [circle]);

  const save = () => {
    supabase
      .from("buziness")
      .upsert({
        ...newBuziness,
        title,
        author: uid,
        location:
          "POINT(" +
          circle?.position.latitude +
          " " +
          circle?.position.longitude +
          ")",
      })
      .then((res) => {
        if (res.error) {
          console.log(res.error);
        }
        console.log(res);
      });
  };
  return (
    <View>
      <TextInput
        placeholder="Bizniszem neve"
        onChangeText={(t) => setNewBuziness({ ...newBuziness, title: t })}
      />
      <TagInput placeholder="Kategóriái" onChange={setCategories} />
      <TextInput
        placeholder="Fejtsd ki bővebben"
        onChangeText={(t) => setNewBuziness({ ...newBuziness, description: t })}
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
        <Button onPress={showModal}>
          {!!circle ? "Környék kiválasztva" : "Válassz környéket"}
        </Button>
      </View>
      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          contentContainerStyle={containerStyle}
        >
          <MapSelector data={circle} setData={setCircle} searchEnabled />
        </Modal>
      </Portal>

      <Button onPress={save}>Feltöltöm</Button>
      <Text>
        {JSON.stringify({
          ...newBuziness,
          title,
          author: uid,
          location:
            "POINT(" +
            circle?.position.latitude +
            " " +
            circle?.position.longitude +
            ")",
        })}
      </Text>
    </View>
  );
}
