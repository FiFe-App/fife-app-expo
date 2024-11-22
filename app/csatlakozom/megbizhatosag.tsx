import Smiley from "@/components/Smiley";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { View } from "react-native";

const Megbizhatosag = () => {
  return (
    <ThemedView style={{ flex: 1, paddingTop: 36, alignItems: "center" }}>
      <View style={{ flex: 1 }}>
        <ThemedText
          type="title"
          style={{ textAlign: "left", marginBottom: 16 }}
        >
          Bizalom a platformon.
        </ThemedText>
        <View
          style={{ alignItems: "center", justifyContent: "center", margin: 24 }}
        >
          <Smiley style={{ width: 100, height: 100 }} />
        </View>
        <ThemedText style={{ marginHorizontal: 16 }}>
          Ezen a közösségi oldalon nagy eséllyel ismeretlen emberekkel fog
          összefújni a szél. Mivel sokan okkal nem bíznak meg másokban, ezen a
          platformon figyelünk arra, hogy legyen alapja a bizalomnak. {"\n\n"}Ha
          találkozol itt valakivel, akiben megbízol és tudod hogy nem vágna át
          másokat, megbízhatónak jelölheted őt, a profilján, hogy így támogasd
          és a bizalom által építsük fel a közösségünket.
        </ThemedText>
      </View>
    </ThemedView>
  );
};

export default Megbizhatosag;
