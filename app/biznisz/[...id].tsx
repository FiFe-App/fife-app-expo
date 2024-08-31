import ProfileImage from "@/components/user/ProfileImage";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { useFocusEffect, useGlobalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { Button, Chip, Text } from "react-native-paper";
import { useSelector } from "react-redux";
import { BuzinessItemInterface } from ".";
import { ThemedView } from "@/components/ThemedView";

export default function Index() {
  const { id: paramId } = useGlobalSearchParams();
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );

  const id: number = Number(paramId);
  const [data, setData] = useState<BuzinessItemInterface | null>(null);
  const categories = data?.title?.split(" ");
  const title = categories?.[0];
  const myBuziness = myUid === data?.author;

  useFocusEffect(
    useCallback(() => {
      const load = () => {
        if (!id) return;
        supabase
          .from("buziness")
          .select("*")
          .eq("id", id)
          .then(({ data, error }) => {
            if (error) {
              console.log(error);
              return;
            }
            if (data) {
              setData(data[0]);
              console.log(data);
            }
          });
      };
      load();
      return () => {};
    }, [id]),
  );

  if (id)
    return (
      <ThemedView style={{ flex: 1 }}>
        <View style={{ flexDirection: "row" }}>
          <View style={{ flex: 1 }}>
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text>{title}</Text>
            </View>
          </View>
        </View>
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
        <View style={{ flex: 1 }}>
          <Text>{data?.description}</Text>
        </View>
      </ThemedView>
    );
}
