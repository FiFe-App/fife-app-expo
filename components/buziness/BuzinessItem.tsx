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
import { IconButton, Surface, Text, useTheme } from "react-native-paper";
import { trackPromise } from "react-promise-tracker";
import { useDispatch, useSelector } from "react-redux";
import CategoryChip from "../CategoryChip";
import MetaStat from "../MetaStat";
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
  const theme = useTheme();
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
              <Text variant="titleLarge" style={{ fontSize: 18, lineHeight: 24 }}>{title}</Text>
              <View style={{ flexWrap: "wrap", flexDirection: "row", gap: Spacing.xs, marginTop: Spacing.xs }}>
                {!!isNew && <CategoryChip key="category-new" style={{ backgroundColor: theme.colors.tertiary }} textStyle={{ color: theme.colors.onTertiary }}>új</CategoryChip>}
                {!!data.ingyen && <CategoryChip key="category-ingyen" style={{ backgroundColor: "#4caf50" }} textStyle={{ color: "#fff" }}>ingyenes</CategoryChip>}
                {categories?.map((e, i) => {
                  if (e.trim())
                    return (
                      <CategoryChip key={"category" + i}>{e}</CategoryChip>
                    );
                })}
              </View>
            </View>
          </View>
          <View style={{ flexWrap: "wrap", flexDirection: "row", gap: Spacing.sm }}>
            <MetaStat icon="account-group">{recommendations} ember ajánlja</MetaStat>
            {!!data.images?.length && <MetaStat icon="image">{data?.images?.length || 0} kép</MetaStat>}
            {!!distanceText && <MetaStat icon="map-marker">{distanceText}</MetaStat>}
          </View>
          <Text variant="bodyMedium" numberOfLines={4} ellipsizeMode="tail" style={{ flex: 1 }}>
            {description}
          </Text>

          {showOptions && myBuziness && (
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: -Spacing.xs, marginBottom: -Spacing.xs }}>
              <IconButton
                icon="pencil-circle"
                iconColor={theme.colors.onSurfaceVariant}
                size={22}
                onPress={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  router.navigate({
                    pathname: "/biznisz/edit/[editId]",
                    params: { editId: id },
                  });
                }}
              />
              <IconButton icon="delete-circle" iconColor={theme.colors.error} size={22} onPress={showDelete} />
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
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
});
