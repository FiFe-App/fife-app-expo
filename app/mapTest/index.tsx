import MapSelector from "@/components/MapSelector/MapSelector";
import { MapCircleType } from "@/components/MapSelector/MapSelector.types";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import axios from "axios";
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Modal, Portal } from "react-native-paper";

export default function Index() {
  const [circle, setCircle] = useState<MapCircleType|undefined>(undefined);
  const [placeName, setPlaceName] = useState<string|null>(null);
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const containerStyle = {backgroundColor: 'white', padding: 20,margin:30,height:500};
  useEffect(() => {
    if (circle) {
      setVisible(false);
      axios.get(`https://geocode.maps.co/reverse?lat=${circle.position.latitude}&lon=${circle.position.longitude}&api_key=${process.env.EXPO_PUBLIC_GEOCODE_API_KEY}`)
      .then(res=>{
        console.log(res.data);
        setPlaceName(res.data.address.amenity || res.data.display_name);
      })
    }
  }, [circle]);

  useEffect(() => {
    navigation.setOptions({ title:'Helyzet választó' });
  }, [navigation]);
  
  return (
    <View>
      <Portal>
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={containerStyle} style={{}}>
          <MapSelector data={circle} setData={setCircle} searchEnabled/>
        </Modal>
      </Portal>      
        <Button style={{marginBottom: 30}} onPress={showModal} mode='contained'>
          Válassz környéket
        </Button>
        {placeName ? <ThemedText>Kiválasztott környék: {placeName} és {circle?.radiusDisplay}-es körzete.</ThemedText> : <ThemedText>Nincs kiválasztva hely.</ThemedText>}

      <ThemedView style={styles.container}>
      </ThemedView>

    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
