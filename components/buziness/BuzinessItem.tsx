import toDistanceText from "@/lib/functions/distanceText";
import wrapper from "@/lib/functions/wrapper";
import { addDialog } from "@/lib/redux/reducers/infoReducer";
import { RootState } from "@/lib/redux/store";
import { BuzinessItemInterface } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { Link, router } from "expo-router";
import { GestureResponderEvent, StyleSheet, View } from "react-native";
import { Card, Chip, Icon, IconButton, Text } from "react-native-paper";
import { trackPromise } from "react-promise-tracker";
import { useDispatch, useSelector } from "react-redux";

interface BuzinessItemProps {
  data: BuzinessItemInterface;
  showOptions?: boolean;
}

const BuzinessItem = ({ data, showOptions }: BuzinessItemProps) => {
  const { author, title, description, id } = data;
  const { uid } = useSelector((state: RootState) => state.user);
  const myBuziness = author === uid;
  const dispatch = useDispatch();

  const distance = data.distance ? Math.round(data?.distance * 10) / 10 : null;
  const distanceText =
    distance !== null
      ? distance !== 0
        ? toDistanceText(distance / 1000) + " távolságra"
        : "közel hozzád"
      : "";
  const categories = title?.split(" ");

  const showDelete = (e: GestureResponderEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(
      addDialog({
        title: categories?.[0] + " Törlése?",
        text: "Nem fogod tudni visszavonni!",
        onSubmit: () => {
          trackPromise(
            wrapper<null, any>(
              supabase
                .from("buziness")
                .delete()
                .eq("id", id)
                .then((res) => {
                  router.push({ pathname: "/user", params: { uid } });
                }),
            ),
            "dialog",
          );
        },
        submitText: "Törlés",
      }),
    );
  };

  return (
    <Link href={{ pathname: "/biznisz/[id]", params: { id: id } }} asChild>
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
              {!showOptions && !!distance !== null && (
                <Text style={{}}>
                  <Icon size={16} source="earth" /> <Text>{distanceText}</Text>
                </Text>
              )}
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text>
                <Icon size={16} source="account-group" />{" "}
                <Text>{data.recommendations} ember ajánlja</Text>
              </Text>
            </View>
          </View>
        </View>
        <Text style={{ flex: 1 }}>{description}</Text>

        {showOptions && myBuziness && (
          <View style={{ flexDirection: "row" }}>
            <IconButton
              icon="pencil-circle"
              onPress={(e) => {
                e.stopPropagation();
                e.preventDefault();
                router.push({
                  pathname: "/biznisz/edit/[editId]",
                  params: { editId: id },
                });
              }}
            />
            <IconButton icon="delete-circle" onPress={showDelete} />
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
  },
});
