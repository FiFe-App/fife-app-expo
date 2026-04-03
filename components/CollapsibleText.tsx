import { PropsWithChildren, useEffect, useState } from "react";

import { Text, TouchableRipple } from "react-native-paper";
import { ThemedText } from "./ThemedText";
import { View } from "react-native";
import { theme } from "@/assets/theme";

function CollapsibleText({ children }: PropsWithChildren) {
  const [isLongDescription, setIsLongDescription] = useState<
    undefined | boolean
  >(undefined);

  useEffect(() => {
    setIsLongDescription(undefined);
  }, []);

  useEffect(() => {
    console.log("isLongDescription", isLongDescription);
    console.log("isundef", isLongDescription !== undefined);
  }, [isLongDescription]);

  return (
    <TouchableRipple
      style={{ padding: 10 }}
      onLayout={(e) => {
        console.log("height",e.nativeEvent.layout.height);
            
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
            console.log("asd");

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
