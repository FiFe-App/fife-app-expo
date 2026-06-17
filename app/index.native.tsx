import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Text } from "react-native-paper";
import { Link, Redirect, Stack } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { Button } from "@/components/Button";
import { Spacing } from "@/constants/spacing";
import Smiley from "@/components/Smiley";
import { BorderRadius } from "@/constants/borderRadius";
import { ThemedView } from "@/components/ThemedView";
import { Logo } from "@/components/Logo";

export default function NativeLanding() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);

  if (uid) return <Redirect href="/me" />;

  return (
    <ThemedView style={{flex:1}} >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.container]}>
        
        <View style={{ flex: 1 }} />
  
        <View style={[styles.logoContainer,]}>
          <Smiley style={{ width: 140, height: 140, borderRadius: BorderRadius.xl, zIndex: 100000 }} />
          <Logo style={{ width: 239, height: 40 }} />
        </View>
  
        <Text variant="displayMedium" style={styles.motto}>
          Közösség a zsebedben
        </Text>
  
        <View style={{ flex: 1 }} />
        <View style={styles.buttonsContainer}>
          <Link asChild href="/csatlakozom">
            <Button mode="contained" type="secondary" big style={{width:"100%"}}>
              Regisztrálok
            </Button>
          </Link>
          <Link asChild href="/login">
            <Button mode="text" >
              Bejelentkezem
            </Button>
          </Link>
        </View>
      </View>
      <View
        style={{
          bottom: 0,
          left: 0,
          opacity:0,
          position:"absolute",
          width: "100%",
          paddingTop: 20,
          alignItems: "center",
        }}
      >
        <Image
          source={require("@/assets/images/Community_Big.png")}
          style={{ width: "100%", height: 400, resizeMode: "cover" }}
          contentFit="cover"
          contentPosition="top"
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex:10,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
  },
  logoContainer: {
    paddingTop: Spacing.xxxl,
    gap: Spacing.xl,
    alignItems: "center",
    flexDirection:"column",
    justifyContent:"center"
  },
  imageContainer: {
    alignItems: "center",
    marginTop: Spacing.xxl,
  },
  heroImage: {
    width: "115%",
    height: 280,
  },
  motto: {
    textAlign: "center",
    marginTop: Spacing.lg,
  },
  buttonsContainer: {
    gap: Spacing.md,
    alignItems: "stretch",
  },
  fullWidth: {
    width: "100%",
  },
});
