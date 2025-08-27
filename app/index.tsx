import Smiley from "@/components/Smiley";
import { ThemedText as Text } from "@/components/ThemedText";
import { ThemedView as View } from "@/components/ThemedView";
import { ThemedButton as Button } from "@/components/ThemedButton";
import { StyleSheet } from "react-native";
import { Image } from "expo-image";

const Header = () => {
  return (
    <View>
      <View style={styles.headerRow} type="card">
        <View style={styles.flex1} />

        <View style={styles.centerRow}>
          <View style={styles.titleRow}>
            <Image
              source={require("../assets/smiley.gif")}
              style={[{ width: 40, height: 40, zIndex: 20 }]}
            />
            <Text type="title" style={styles.appTitle}>FiFe App</Text>
          </View>
        </View>

        <View style={styles.rightSide}>
          <Button style={styles.loginButton} mode="contained">
            Bejelentkezem
          </Button>
        </View>
      </View>
    </View>
  );
};
const Hero = () => {
  return (
    <View style={{padding: 48}}>
      <Text type="title">Találj megbízható embereket a környékeden!</Text>
      <View style={[styles.centerRow,]}>
        <View style={[styles.flex1,{gap:16}]}>
          <Text type="subtitle">Fedezz fel egy segítői hálózatot, ebben az új, közösségi alkalmazásban.</Text>
          <Button style={styles.loginButton} type="tertiary">
            Regisztrálok
          </Button>
          <Button style={styles.loginButton} mode="contained">
            Bejelentkezem
          </Button>
        </View>

        <View style={[styles.flex1,styles.rightSide]}>
          <Image source={require("../assets/images/Connected.png")}
              contentFit="cover"
              style={[{ width: '100%', minHeight: 300, zIndex: 20 }]}/>
        </View>
      </View>
    </View>
  );
};

export default function App() {
  return (
    <View type="default" style={{flex:1}}>
      <Header />
      <Hero />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    position:"sticky",
    top:0,
    width:'100%',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24, // px-6
    paddingVertical: 12, // py-3
  },
  flex1: { flex: 1 },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  appTitle: {
    marginLeft: 12, // gap-3
  },
  rightSide: {
    flex: 1,
    alignItems: "flex-end",
  },
  loginButton: {
    borderRadius: 12, // rounded-xl-ish
  },
});
