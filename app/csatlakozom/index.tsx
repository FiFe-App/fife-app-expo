import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Link } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Text, TextInput, TouchableRipple } from "react-native-paper";

const Register = () => {
  return (
    <ThemedView style={{ flex: 1, padding: 8, alignItems: "center" }}>
      <View style={{ flex: 1 }}>
        <ThemedText style={{}}>
          Ez egy közösségi oldal, ami összegyűjti a kedves embereket, hogy
          zavartalanul tudjanak kommunikálni, egy független, biztonságos
          környezetben. Egy alkalmazás, ami az asszertív kommunikációnak,
          kölcsönös jóindulatnak és bizalomnak nyit kaput. Amely 100%-ig a a
          emberekért, értünk létezik és fejlődik.
        </ThemedText>
      </View>
      <View
        style={{ alignItems: "flex-end", alignSelf: "flex-end", padding: 16 }}
      >
        <Link href="./iranyelvek" asChild>
          <Button mode="contained">Tovább</Button>
        </Link>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  text: {
    textAlign: "left",
    marginBottom: 10,
    backgroundColor: "#ffffff99",
  },
  inputView: {},
  input: {
    color: "black",
    padding: 0,
    paddingHorizontal: 10,
    fontSize: 15,
    overflow: "hidden",
  },
  inputContent: {
    paddingTop: 10,
    paddingHorizontal: 10,
    letterSpacing: 0,
    color: "black",
    zIndex: 10,
    overflow: "hidden",
  },
  textToType: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    position: "absolute",
    userSelect: "none",
    backgroundColor: "transparent",
    color: "gray",
    cursor: "text",
    fontSize: 15,
    zIndex: 10,
  },
});
export default Register;
