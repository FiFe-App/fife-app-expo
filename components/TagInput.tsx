import Icon from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  NativeSyntheticEvent,
  Pressable,
  StyleProp,
  TextInputKeyPressEventData,
  TextInputSubmitEditingEventData,
  View,
  ViewStyle,
} from "react-native";
import { Card, Text, TextInput } from "react-native-paper";

interface TagInputType {
  onChange: React.SetStateAction<any>;
  value?: string;
  defaultValue?: string;
  style?: StyleProp<ViewStyle>;
  placeholder?: string;
}

const TagInput = ({
  onChange,
  defaultValue,
  style,
  placeholder,
  value,
}: TagInputType) => {
  const list = (value || "")
    .split(" ")
    .slice(0, -1)
    .filter((e) => e.length);
  const text = (value || "").split(" ").slice(-1)[0].trim();

  const edit = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === "Backspace" && text === "") {
      e.preventDefault();
      onChange(toString([...list]).trim());
    }
  };
  const onSubmit = (
    e: NativeSyntheticEvent<TextInputSubmitEditingEventData>,
  ) => {
    onChange(toString([...list, text + " "]));
    e.preventDefault();
    e.currentTarget.focus();
  };
  const onBlur = () => {
    if (text.length) {
      onChange(toString([...list, text, " "]));
    }
  };
  const onChangeText = (e: string) => {
    console.log("change", e);
    onChange((toString(list) + " " + e).trimStart());
  };

  const toString = (arr: string[]): string => {
    return arr.reduce((partialSum, a) => partialSum + " " + a, "");
  };

  const TagList = () => (
    <>
      {list.map((e, i) => {
        if (e.length)
          return (
            <Card
              key={"tags" + i}
              style={{ margin: 4 }}
              contentStyle={{
                flexDirection: "row",
              }}
            >
              <Text>{e}</Text>
              <Pressable
                onPress={() => {
                  onChange(toString(list.filter((el, ind) => ind !== i)) + " ");
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
          padding: 4,
        }}
        onSubmitEditing={onSubmit}
        onChangeText={onChangeText}
        onKeyPress={edit}
        onBlur={onBlur}
        value={text}
      />
    </Card>
  );
};

export default TagInput;
