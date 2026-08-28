import { BuzinessSearchItemInterface } from "@/redux/store.type";
import { Image } from "expo-image";
import { router } from "expo-router";
import { View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import BuzinessItem from "../buziness/BuzinessItem";
import SectionLabel from "../buziness/SectionLabel";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { Button } from "../Button";

interface MyBuzinessesProps {
  buzinesses: BuzinessSearchItemInterface[];
  loading: boolean;
  myProfile: boolean;
  name?: string;
}

const MyBuzinesses = ({ buzinesses, loading, myProfile, name }: MyBuzinessesProps) => {
  return (
    <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.md }}>
      {loading ? (
        <View style={{ padding: Spacing.xxxl, alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      ) : buzinesses.length ? (
        <>
          {myProfile && (
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Button
                mode="outlined"
                icon="plus"
                style={{ borderRadius: BorderRadius.pill }}
                onPress={() => router.push("/biznisz/new")}
              >
                Új biznisz
              </Button>
            </View>
          )}
          {!myProfile && <SectionLabel label={myProfile ? "Mihez értek?" : `${name} bizniszei`} />}
          {buzinesses.map((buzinessItem) => (
            <BuzinessItem
              data={buzinessItem}
              key={buzinessItem.id}
              showOptions={myProfile}
            />
          ))}
        </>
      ) : (
        <View style={{ alignItems: "center", gap: Spacing.lg, padding: Spacing.sm }}>
          <ThemedView responsive={400} style={{ flexDirection: "row", padding: Spacing.sm, alignItems: "center",gap: Spacing.lg }}>

            <View style={{ alignItems: "center", justifyContent: "center", gap: Spacing.lg }}>

              <Image
                source={require("@/assets/images/img-prof.png")}
                style={{ height: 150, width: 150 }}
              />
            </View>
              <ThemedText variant="bodyMedium" style={{fontFamily:"Piazzolla-ExtraBold"}}>
                {myProfile
                  ? "Hirdesd magad vagy vállalkozásodat ingyen a bizniszeddel!"
                  : `${name} még nem adott meg bizniszt.`}
              </ThemedText>
              {myProfile && (
                <Button
                  mode="contained"
                  icon="plus"
                  style={{ borderRadius: BorderRadius.pill }}
                  onPress={() => router.push("/biznisz/new")}
                >
                  Új biznisz
                </Button>
              )}
            {myProfile && <View>
              <ThemedText type="subtitle">
              A te bizniszeid azon hobbijaid, képességeid vagy szakmáid listája,
              amelyeket meg szeretnél osztani másokkal is. {"\n"} 
            </ThemedText>
            <ThemedText type="label">
              Példák: Kutyát sétáltatok, Zenét csinálok, Elviszem az 50 Ft-os palackokat</ThemedText>
            </View>}
            </ThemedView>
        </View>
      )}
    </View>
  );
};

export default MyBuzinesses;
