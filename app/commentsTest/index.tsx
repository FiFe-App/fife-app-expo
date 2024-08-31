import Comments from "@/components/comments/Comments";
import { ThemedView } from "@/components/ThemedView";
import { View } from "react-native";
import { Text } from "react-native-paper";

export default function Index() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={{ height: 300 }}>
        <Text>Some content</Text>
      </View>
      <Comments path="testComments" placeholder="Szólj hozzá!" limit={100} />
    </ThemedView>
  );
}
