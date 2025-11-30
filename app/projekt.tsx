import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Text } from "react-native-paper";
import { useBreakpoint } from "@/components/layout/ResponsiveLayout";
import { Link } from "expo-router";
import { Footer } from "./index";
import { theme } from "@/assets/theme";


const AboutMe = () => {
  const { isDesktop } = useBreakpoint();
  return (
    <View style={{ marginHorizontal: 32 }}>
      <ThemedView
        style={[{ paddingVertical: 16, alignItems: "flex-start" }]}
        responsive={800}
      >
        <View
          style={[
            isDesktop && [styles.flex1, {}],
            { gap: 16, width: "100%", alignItems: "flex-start", zIndex: 10 },
          ]}
        >
          <Text variant="displayMedium">Csatlakozz a FiFe  App csapatához!</Text>
          <Text variant="bodyLarge">
            Ez egy nonprofit, open source projekt, így mindig elkél a segítség.
          </Text>
          <Text variant="displaySmall">
            Szükségünk van:
          </Text>
          <View style={{ gap: 4 }}>
            <Text variant="bodyLarge">• React Native fejlesztőre</Text>
            <Text variant="bodyLarge">• Jogi tanácsadóra</Text>
            <Text variant="bodyLarge">• Pályázatra</Text>
          </View>
          <Text variant="bodyLarge">
            Ha beszállnál, írj egy e-mailt ide: <Text variant="bodyLarge" style={{color:theme.colors.tertiary}}><Link href="mailto:kristofakos1229@gmail.com">kristofakos1229@gmail.com</Link></Text>
          </Text>
          <ThemedView responsive={1000} style={{ gap: 16, zIndex: 10 }}>
            <Link href="https://github.com/FiFe-App/fife-app-expo" asChild>
              <Button type="secondary" big>
                Github
              </Button>
            </Link>
            <Link href="https://www.patreon.com/c/fifeapp" asChild>
              <Button mode="contained" big>
                Patreon
              </Button>
            </Link>
          </ThemedView>
        </View>
        <View
          style={[
            styles.flex1,
            styles.rightSide,
            {
              width: "100%",
              maxWidth: 350,
              justifyContent: "center",
              zIndex: 5,
            },
          ]}
        >
          <Image
            source={require("../assets/images/Trust.png")}
            contentFit="contain"
            style={{ width: "100%", minHeight: 350, zIndex: 5 }}
          />
        </View>
      </ThemedView>
    </View>
  );
};

export default function Projekt() {
  return (
    <ScrollView style={{ flex: 1 }}>
      <ThemedView type="default" style={{ flex: 1, alignItems: "center" }}>
        <View style={{ flex: 1, gap: 16, maxWidth: 1000 }}>
          <AboutMe />
        </View>
      </ThemedView>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderBottomColor: "rgba(0,0,0,0.06)",
    borderBottomWidth: 0.5,
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
  rightSide: {
    flex: 1,
    alignItems: "flex-end",
  },
  loginButton: {
    borderRadius: 12,
    width: "100%",
  },
  rowWrap: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  colStack: {
    flexDirection: "column",
  },
  stepCard: {
    flex: 1,
    borderRadius: 16,
    gap: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  stepCol: {
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
});
