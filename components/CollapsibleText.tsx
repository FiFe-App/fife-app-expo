import { PropsWithChildren, useEffect, useState } from "react";

import { Text, TouchableRipple } from "react-native-paper";
import { ThemedText } from "./ThemedText";
import { StyleProp, View, ViewStyle } from "react-native";
import { Spacing } from "@/constants/spacing";

function CollapsibleText({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const [isLongDescription, setIsLongDescription] = useState<
    undefined | boolean
  >(undefined);

  useEffect(() => {
    setIsLongDescription(undefined);
  }, []);

  return (
    <TouchableRipple
      style={[{ padding: Spacing.sm }, style]}
      onLayout={(e) => {
        if (
          isLongDescription === undefined &&
              e.nativeEvent.layout.height > 165
        ) {
          setIsLongDescription(true);
        }
      }}
      onPress={
        isLongDescription !== undefined
          ? () => {
            setIsLongDescription(!isLongDescription);
          }
          : undefined
      }
      disabled={isLongDescription === undefined}
    >
      <View style={{gap:8}}>
        <Text numberOfLines={isLongDescription ? 10 : undefined} >
          {children}
        </Text>
        {isLongDescription !== undefined && (
          <ThemedText>{isLongDescription ? "Több" : ""}</ThemedText>
        )}
      </View>
    </TouchableRipple>
  );
}

export default CollapsibleText;
