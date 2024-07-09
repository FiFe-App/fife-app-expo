import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import axios from "axios";
import { useFocusEffect, useGlobalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useSelector } from "react-redux";

export default function Index() {
  const { uid } = useGlobalSearchParams();
  const { userData }: UserState = useSelector((state: RootState) => state.user);
  const [data, setData] = useState("");
  useFocusEffect(
    useCallback(() => {
      load();
      return () => {};
    }, [uid]),
  );
  console.log(userData);

  const load = () => {
    console.log(axios.defaults);

    axios
      .get("users/" + uid, {
        baseURL: "http://localhost:8888/",
        headers: {
          Authorization: userData.authorization,
        },
      })
      .then((res) => {
        setData(JSON.stringify(res.data));
        console.log(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <View>
      {uid}
      <Button onPress={load}>Reload</Button>
      <Text>{data}</Text>
    </View>
  );
}

const styles = StyleSheet.create({});
