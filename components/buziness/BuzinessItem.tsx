import { buziness } from "@/app";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import ProfileImage from "../user/ProfileImage";
import { BuzinessItemInterface } from "@/app/biznisz";
import toDistanceText from "@/lib/functions/distanceText";

interface BuzinessItemProps {
  data: BuzinessItemInterface;
}

const BuzinessItem = ({ data }: BuzinessItemProps) => {
  const { uid, name, description, id } = data;

  const distance = Math.round(data?.page?.[0]?.distance * 10) / 10;
  const distanceText = toDistanceText(distance / 1000);

  const categories = name?.split(" ") || name;
  const small = true;
  return (
    <Pressable
      style={styles.container}
      onPress={() => router.navigate({ pathname: "biznisz", params: { id } })}
    >
      <Text style={{ whiteSpace: "pre" }}>{categories?.[0]}</Text>
      <View style={{ flexWrap: "wrap", flexDirection: "row" }}>
        {categories?.slice(1).map((e, i) => (
          <View
            key={"category" + i}
            style={{
              backgroundColor: "#FFC372",
              borderRadius: 8,
              padding: 2,
              margin: 2,
            }}
          >
            <Text>{e}</Text>
          </View>
        ))}
      </View>
      <Text style={{}}>{description}</Text>
      <View style={{ flexDirection: "row" }}>
        <View style={{ marginRight: 8, justifyContent: "flex-end" }}>
          <View style={{}}>
            {!!distance && (
              <Text style={{}}>
                <Icon size={16} source="earth" style={styles.p1} />
                <Text>{distanceText + " távolságra"}</Text>
              </Text>
            )}
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text
              style={[small ? styles.justifyS : styles.justifyS, styles.alignC]}
            >
              <Icon size={16} source="account-group" style={styles.p1} />
              <Text>{data} ember ajánlja</Text>
            </Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <ProfileImage uid={uid} style={{ flex: 1 }} />
        </View>
      </View>
    </Pressable>
  );
};

export default BuzinessItem;

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "white",
    borderRadius: 8,
    width: "100%",
    margin: "auto",
  },
});
