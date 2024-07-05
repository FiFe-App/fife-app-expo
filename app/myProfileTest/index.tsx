import axios from "axios";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { View, Text } from "react-native";
import { Button } from "react-native-paper";

export default function Index() {
  useFocusEffect(
    useCallback(() => {
      return () => {
        console.log("This route is now unfocused.");
      };
    }, []),
  );

  const send = () => {
    axios
      .get("all/latest")
      .then((res) => {
        console.log(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  return (
    <View style={{ maxWidth: 400, width: "100%", gap: 8, margin: "auto" }}>
      <Button onPress={send}>
        <Text>GET</Text>
      </Button>
    </View>
  );
}
