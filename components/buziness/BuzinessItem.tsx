import toDistanceText from "@/lib/functions/distanceText";
import wrapper from "@/lib/functions/wrapper";
import { supabase } from "@/lib/supabase/supabase";
import { addDialog } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { BuzinessItemInterface } from "@/redux/store.type";
import { Link, router } from "expo-router";
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Chip, Icon, IconButton, Surface, Text } from "react-native-paper";
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

  const categories = title?.split(" $ ");

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
                  router.navigate({ pathname: "/user", params: { uid } });
                })
            ),
            "dialog"
          );
        },
        submitText: "Törlés",
      })
    );
  };

  return (
    <Link href={{ pathname: "/biznisz/[id]", params: { id: id } }} asChild>
      <Pressable>
        <Surface style={styles.container} elevation={2} mode="flat">
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
          </View>
          <View style={{flexWrap:"wrap",flexDirection:"row",gap:4}}>
            <View style={{ flexDirection: "row" }}>
              <Text>
                <Icon size={16} source="account-group" />{" "}
                <Text>{data?.recommendations} ember ajánlja</Text>
              </Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text>
                <Icon size={16} source="image" />{" "}
                <Text>{data?.images?.length || 0} kép</Text>
              </Text>
            </View>
            {distanceText && <View style={{ flexDirection: "row" }}>
              <Text>
                <Icon size={16} source="map-marker" />{" "}
                <Text>{distanceText}</Text>
              </Text>
            </View>}
          </View>
          <Text numberOfLines={4} ellipsizeMode="tail" style={{ flex: 1 }}>
            {description}
          </Text>

          {showOptions && myBuziness && (
            <View style={{ flexDirection: "row" }}>
              <IconButton
                icon="pencil-circle"
                onPress={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  router.navigate({
                    pathname: "/biznisz/edit/[editId]",
                    params: { editId: id },
                  });
                }}
              />
              <IconButton icon="delete-circle" onPress={showDelete} />
            </View>
          )}
        </Surface>
      </Pressable>
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
    gap:4,
  },
});
