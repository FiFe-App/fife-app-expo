import Comments from "@/components/comments/Comments";
import { View } from "react-native";
import { Text } from "react-native-paper";

export default function Index() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 300 }}>
        <Text>Some content</Text>
      </View>
      <Comments path="testComments" placeholder="Szólj hozzá!" limit={100} />
    </View>
  );
}
