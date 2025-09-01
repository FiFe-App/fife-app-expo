import { PropsWithChildren, useEffect, useState } from "react";

import { Text, TouchableRipple } from "react-native-paper";

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
      <Text>
        <Text
          numberOfLines={isLongDescription ? 10 : undefined}
          onLayout={(e) => {
            if (
              isLongDescription === undefined &&
              e.nativeEvent.layout.height > 165
            ) {
              setIsLongDescription(true);
            }
          }}
        >
          {children}
        </Text>
        {isLongDescription !== undefined && (
          <Text>{isLongDescription ? "Több" : ""}</Text>
        )}
      </Text>
    </TouchableRipple>
  );
}

export default CollapsibleText;
