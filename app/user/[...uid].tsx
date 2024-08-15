import { friendship, user } from "@/app";
import ProfileImage from "@/components/user/ProfileImage";
import { Tables } from "@/database.types";
import elapsedTime from "@/lib/functions/elapsedTime";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import axios, { AxiosResponse } from "axios";
import { useFocusEffect, useGlobalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useSelector } from "react-redux";

type UserInfo = Tables<"profiles">;

export default function Index() {
  const { uid: paramUid } = useGlobalSearchParams();
  const uid: string = paramUid as string;
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const myProfile = myUid === uid;
  const [data, setData] = useState<UserInfo | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = () => {
        console.log(axios.defaults);

        supabase
          .from("profiles")
          .select()
          .eq("id", uid)
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
    }, [uid]),
  );

  if (uid)
    return (
      <View>
        <View style={{ flexDirection: "row" }}>
          <ProfileImage uid={uid} style={{ width: 100, height: 100 }} />
          <View style={{ flex: 1 }}>
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text>{data?.full_name}</Text>
            </View>
            <View style={{ flexDirection: "row", flex: 1 }}>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text>{0}</Text>
                <Text>Pajtások</Text>
              </View>
              {data?.created_at && (
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text>
                    {elapsedTime(Date.parse(data.created_at.toString()))}
                  </Text>
                  <Text>Fife</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 4, margin: 4 }}>
          <Button style={{ flex: 1 }} mode="contained" disabled>
            Legyen a pajtásom
          </Button>
          <Button style={{ flex: 1 }} mode="contained-tonal" disabled>
            Üzenek neki
          </Button>
        </View>
      </View>
    );
}
