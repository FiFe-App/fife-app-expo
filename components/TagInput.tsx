import React from "react";
import {
  NativeSyntheticEvent,
  StyleProp,
  TextInputKeyPressEventData,
  TextInputSubmitEditingEventData,
  ViewStyle,
} from "react-native";
import { Card, Chip, TextInput } from "react-native-paper";

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
    .split(" $ ")
    .slice(0, -1)
    .filter((e) => e.length);
  const text = (value || "").split(" $ ").slice(-1)[0];

  console.log(list);
  console.log(text);

  const edit = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === "Backspace" && text === "") {
      e.preventDefault();
      onChange(toString([...list]));
    }
  };
  const onSubmit = (
    e: NativeSyntheticEvent<TextInputSubmitEditingEventData>,
  ) => {
    onChange(toString([...list, text.trim() + " $ "]));
    e.preventDefault();
    e.currentTarget.focus();
  };
  const onBlur = () => {
    if (text.length) {
      onChange(toString([...list, text.trim(), " $ "]));
    }
  };
  const onChangeText = (e: string) => {
    console.log("change", e);
    if (!e.includes("$")) onChange(toString(list) + " $ " + e);
  };

  const toString = (arr: string[]): string => {
    return arr.reduce((partialSum, a) => partialSum + " $ " + a, "");
  };

  const TagList = () => (
    <>
      {list.map((e, i) => {
        if (e.length)
          return (
            <Chip
              key={"tags" + i}
              style={{ margin: 4 }}
              onClose={() => {
                onChange(toString(list.filter((el, ind) => ind !== i)) + " $ ");
              }}
              closeIcon="close"
            >
              {e}
            </Chip>
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
