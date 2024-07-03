import Comments from "@/components/Comments/Comments";
import { View } from "react-native";

export default function Index() {

  return (
    <View style={{}}>
      <Comments path="testComments" placeholder="Szólj hozzá!" limit={100}  />
    </View>
  );
}

