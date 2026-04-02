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
import { Button, Icon, IconButton, Surface, Text } from "react-native-paper";
import { trackPromise } from "react-promise-tracker";
import { useDispatch, useSelector } from "react-redux";
import { ThemedText } from "../ThemedText";
import { theme } from "@/assets/theme";
import CategoryChip from "../CategoryChip";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";

interface BuzinessItemProps {
  data: BuzinessItemInterface;
  showOptions?: boolean;
}

const BuzinessItem = ({ data, showOptions }: BuzinessItemProps) => {
  const { author, title: titleAndCats, description, id } = data;

  const recommendations = typeof data?.recommendations?.[0]?.count === "number" ? data?.recommendations?.[0]?.count : data.recommendations;
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

  const isNew = data?.created_at && new Date().getTime() - new Date(data.created_at).getTime() < 1000 * 60 * 60 * 24 * 10;

  const splitted = titleAndCats?.split(" $ ");
  const title = splitted?.[0] || "";
  const categories = splitted.splice(1);

  const showDelete = (e: GestureResponderEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(
      addDialog({
        title: title + " Törlése?",
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
              <ThemedText variant="titleMedium" type="bold" >{title}</ThemedText>
              <View style={{ flexWrap: "wrap", flexDirection: "row", gap: Spacing.xs, marginTop: Spacing.xs }}>
                {!!isNew && <CategoryChip key="category-new" style={{ backgroundColor: theme.colors.tertiary }} textStyle={{ color: theme.colors.onTertiary }}>új</CategoryChip>}
                {categories?.map((e, i) => {
                  if (e.trim())
                    return (
                      <CategoryChip key={"category" + i}>{e}</CategoryChip>
                    );
                })}
              </View>
            </View>
          </View>
          <View style={{ flexWrap: "wrap", flexDirection: "row", gap: Spacing.xs }}>
            <View style={{ flexDirection: "row" }}>
              <Text>
                <Icon size={16} source="account-group" />
                <Text style={{ marginLeft: Spacing.xs }}> {recommendations} ember ajánlja</Text>
              </Text>
            </View>
            {data.images?.length && <View style={{ flexDirection: "row" }}>
              <Text>
                <Icon size={16} source="image" />
                <Text style={{ marginLeft: Spacing.xs }}> {data?.images?.length || 0} kép</Text>
              </Text>
            </View>}
            {!!distanceText && <View style={{ flexDirection: "row" }}>
              <Text>
                <Icon size={16} source="map-marker" />
                <Text style={{ marginLeft: Spacing.xs }}>{distanceText}</Text>
              </Text>
            </View>}
          </View>
          <ThemedText numberOfLines={4} ellipsizeMode="tail" style={{ flex: 1 }}>
            {description}
          </ThemedText>

          {showOptions && myBuziness && (
            <View style={{ flexDirection: "row", alignItems:"flex-end", gap: 4 }}>
              <Button
                icon="pencil-circle"
                mode="text"
                onPress={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  router.navigate({
                    pathname: "/biznisz/edit/[editId]",
                    params: { editId: id },
                  });
                }}
              >Szerkesztés</Button>
              <Button textColor={theme.colors.error} mode="text" icon="delete-circle" onPress={showDelete} >
                Törlés
              </Button>
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
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.xs,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
});
