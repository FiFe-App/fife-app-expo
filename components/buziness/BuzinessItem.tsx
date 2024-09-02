import { BuzinessItemInterface } from "@/app/biznisz";
import toDistanceText from "@/lib/functions/distanceText";
import { RootState } from "@/lib/redux/store";
import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Card, Chip, Icon, IconButton, Text } from "react-native-paper";
import { useSelector } from "react-redux";
import ProfileImage from "../user/ProfileImage";

interface BuzinessItemProps {
  data: BuzinessItemInterface;
  showOptions?: boolean;
}

const BuzinessItem = ({ data, showOptions }: BuzinessItemProps) => {
  const { author, title, description, id } = data;
  const { uid } = useSelector((state: RootState) => state.user);
  const myBuziness = author === uid;

  const distance = data?.distance ? Math.round(data?.distance * 10) / 10 : null;
  const distanceText = distance ? toDistanceText(distance / 1000) : "";

  const categories = title?.split(" ");
  return (
    <Link href={"biznisz/" + id} asChild>
      <Card style={styles.container}>
        <View style={{ flexDirection: "row" }}>
          <View style={{ flex: 1 }}>
            <Text style={{}}>{categories?.[0]}</Text>
            <View style={{ flexWrap: "wrap", flexDirection: "row", gap: 4 }}>
              {categories?.slice(1).map((e, i) => {
                if (e.trim())
                  return (
                    <Chip key={"category" + i} textStyle={{ margin: 4 }}>
                      <Text>{e}</Text>
                    </Chip>
                  );
              })}
            </View>
          </View>
          <View
            style={{
              marginRight: 8,
            }}
          >
            <View style={{}}>
              {!!distance && (
                <Text style={{}}>
                  <Icon size={16} source="earth" />{" "}
                  <Text>{distanceText + " távolságra"}</Text>
                </Text>
              )}
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text>
                <Icon size={16} source="account-group" />{" "}
                <Text>x ember ajánlja</Text>
              </Text>
            </View>
          </View>
        </View>
        <Text style={{ flex: 1 }}>{description}</Text>

        {showOptions && myBuziness && (
          <View>
            <IconButton icon="pencil-circle" />
          </View>
        )}
      </Card>
    </Link>
  );
};

export default BuzinessItem;

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: 8,
    marginHorizontal: 4,
    padding: 8,
    backgroundColor: "#fffafe",
  },
});
