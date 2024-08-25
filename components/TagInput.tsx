import {
  NativeSyntheticEvent,
  Pressable,
  StyleProp,
  TextInputKeyPressEventData,
  View,
  ViewStyle,
} from "react-native";
import React, { useEffect, useState } from "react";
import Icon from "@expo/vector-icons/Ionicons";
import { TextInput, Text, Card } from "react-native-paper";

interface TagInputType {
  onChange: React.SetStateAction<any>;
  defaultValue?: string;
  style?: StyleProp<ViewStyle>;
  placeholder?: string;
}

const TagInput = ({
  onChange,
  defaultValue,
  style,
  placeholder,
}: TagInputType) => {
  const [text, setText] = useState("");
  const l = text?.includes(" ") ? text.split(" ") : [];
  const [list, setList] = useState(defaultValue?.split(" ") || []);

  useEffect(() => {
    if (text && text !== " ") {
      setList([...list, text]);
      setText("");
    }
  }, [l.length]);

  useEffect(() => {
    console.log("list.defVal", list);
    if (defaultValue && (!list.length || list[0] === ""))
      setList(defaultValue?.split(" "));
  }, [defaultValue]);

  useEffect(() => {
    onChange(list.reduce((partialSum, a) => partialSum + a, ""));
  }, [list]);

  const edit = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === "Backspace" && text === "") {
      setList(list.slice(0, -1));
    }
  };

  const TagList = () => (
    <>
      {list.map((e, i) => {
        if (e.length)
          return (
            <Card
              key={"tags" + i}
              style={{ padding: 4, margin: 4 }}
              contentStyle={{
                flexDirection: "row",
              }}
            >
              <Text>{e}</Text>
              <Pressable
                onPress={() => {
                  setList(list.filter((el, ind) => ind !== i));
                }}
              >
                <View style={{ paddingHorizontal: 8 }}>
                  <Icon name="close" size={17} />
                </View>
              </Pressable>
            </Card>
          );
      })}
    </>
  );
  return (
    <Card
      mode="contained"
      contentStyle={{
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
      }}
      style={[{}, style]}
    >
      <TagList />
      <TextInput
        placeholder={placeholder}
        contentStyle={{ flexGrow: 1 }}
        style={{
          flexGrow: 1,
          fontSize: 17,
          borderRadius: 8,
          padding: 4,
        }}
        onChangeText={setText}
        onKeyPress={edit}
        value={text}
      />
    </Card>
  );
};

export default TagInput;
