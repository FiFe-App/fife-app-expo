import SmallChip from "@/components/SmallChip";
import Smiley from "@/components/Smiley";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { View } from "react-native";

const Megbizhatosag = () => {
  return (
    <ThemedView style={{ flex: 1, alignItems: "center" }}>
      <View style={{ flex: 1 }}>
        <ThemedText
          type="title"
          style={{ textAlign: "left", marginBottom: 16 }}
        >
          Biztonság a platformon.
        </ThemedText>
        <View
          style={{ alignItems: "center", justifyContent: "center", margin: 24 }}
        >
          <Smiley style={{ width: 100, height: 100 }} />
        </View>
        <ThemedText style={{ marginHorizontal: 16 }}>
          Ezen a közösségi oldalon kiemelt szempont a biztonság illetve a
          bizalom. Ha találkozol itt valakivel, akiben megbízol és tudod hogy
          nem vágna át másokat, <SmallChip>megbízhatónak</SmallChip> jelölheted
          őt a profilján.
        </ThemedText>
      </View>
    </ThemedView>
  );
};

export default Megbizhatosag;
