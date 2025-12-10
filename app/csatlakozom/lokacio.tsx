import MapSelector from "@/components/MapSelector/MapSelector";
import style from "@/components/mapView/style";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useState } from "react";
import {
  StyleSheet, View
} from "react-native";

const Location = () => {
  const [location, setLocation] = useState();

  return (
    <ThemedView style={{ flex: 1, padding: 8,  }}>
      <View style={{ flex: 1}}>
        <ThemedText type="title" style={{ marginBottom: 16 }}>
          Merre szoktál járkálni?
        </ThemedText>
        <ThemedText>Ha megadod egy nagy körben, hogy merre mozogsz általában, a környékbeli fiféket könyebben megtalálod. Nem kell pontosan megadnod semmit.</ThemedText>

        <ThemedView style={[{width:"100%",flex:1, marginTop: 8}]}>
          <MapSelector 
            isGetAddress
            searchEnabled
            data={location} setData={setLocation} />
        </ThemedView>
      </View>
      <View style={{ marginVertical: 20 }}>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  text: {
    textAlign: "left",
    marginBottom: 10,
  },
  listItem: {
    alignItems: "center",
    fontSize: 17,
    margin: 5,
  },
  inputView: {},
  input: {
    padding: 0,
    paddingHorizontal: 10,
    fontSize: 15,
    zIndex: 10,
    overflow: "hidden",
  },
  inputContent: {
    paddingTop: 10,
    paddingHorizontal: 10,
    letterSpacing: 0,
    zIndex: 20,
    overflow: "hidden",
  },
  textToType: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    position: "absolute",
    userSelect: "none",
    cursor: "text",
    fontSize: 15,
    fontWeight: "400",
    zIndex: 150,
  },
});
export default Location;
