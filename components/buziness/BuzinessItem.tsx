import { BuzinessItemInterface } from "@/app/biznisz";
import toDistanceText from "@/lib/functions/distanceText";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Card, Icon, Text } from "react-native-paper";
import ProfileImage from "../user/ProfileImage";

interface BuzinessItemProps {
  data: BuzinessItemInterface;
}

const BuzinessItem = ({ data }: BuzinessItemProps) => {
  const { author, title, description, id } = data;

  const distance = data?.distance ? Math.round(data?.distance * 10) / 10 : null;
  const distanceText = distance ? toDistanceText(distance / 1000) : "";

  const categories = title?.split(" ");
  return (
    <Card
      style={styles.container}
      onPress={() => router.navigate({ pathname: "biznisz", params: { id } })}
    >
      <Text style={{}}>{categories?.[0]}</Text>
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
                <Icon size={16} source="earth" />
                <Text>{distanceText + " távolságra"}</Text>
              </Text>
            )}
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text>
              <Icon size={16} source="account-group" />
              <Text>{5} ember ajánlja</Text>
            </Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <ProfileImage uid={author} style={{}} />
        </View>
      </View>
    </Card>
  );
};

export default BuzinessItem;

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "white",
    borderRadius: 8,
    marginHorizontal: 4,
    padding: 8,
    margin: "auto",
  },
});
