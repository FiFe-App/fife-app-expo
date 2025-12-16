import "@expo/match-media"; // enables window.matchMedia across platforms
import { clearOptions } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { Link, useGlobalSearchParams, useNavigation, usePathname, useSegments } from "expo-router";
import React, { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useWindowDimensions, View, ViewStyle } from "react-native";
import { Appbar, Menu } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { theme } from "@/assets/theme";
import { Image } from "expo-image";
import Smiley from "@/components/Smiley";

export const MyAppbar = ({ center, style }: { center?: ReactNode, style?: ViewStyle }) => {
    const navigation = useNavigation();
    const { options } = useSelector((state: RootState) => state.info);
    const [showMenu, setShowMenu] = useState(false);
    const { width } = useWindowDimensions();
    const dispatch = useDispatch();
    const segments = useSegments();
    const pathname = usePathname();
    const { searchParams } = useGlobalSearchParams();

    useEffect(() => {
        console.log("cleared");

        dispatch(clearOptions());
    }, [dispatch, segments, searchParams]);

    return (
        <Appbar.Header
            mode="center-aligned"
            style={[{
                backgroundColor: theme.colors.background,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 2,
                borderBottomColor: "rgba(0,0,0,0.06)",
                borderBottomWidth: 0.5,
                alignItems: "center",
                width: "100%"
            }, style]}
        >
            {navigation.canGoBack() && pathname !== "/home" && pathname !== "/" ? <Appbar.BackAction onPress={navigation.goBack} /> : <View style={{ width: 48 }} />}
            {center || <Link href="/" style={{ flex: 1 }} asChild>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}><Smiley />
                    <Image
                        source={require("../assets/Logo.png")}
                        style={{ width: 180, height: 30, zIndex: 20 }}
                        contentFit="contain"
                    /></View>
            </Link>}
            {options.length > 0 ?
                <> {options?.length === 1 && <Appbar.Action {...options[0]} />}
                    {options?.length > 1 && (
                        <>
                            <Appbar.Action
                                icon="dots-vertical"
                                onPress={() => setShowMenu(true)}
                            />
                            <Menu
                                anchor={{ x: width, y: 0 }}
                                visible={showMenu}
                                onDismiss={() => setShowMenu(false)}
                            >
                                {options.map((option, ind) => (
                                    <Menu.Item
                                        theme={{ colors: { onSurface: "green" } }}
                                        key={"option" + ind}
                                        onPress={option.onPress}
                                        title={option.title}
                                        disabled={option.disabled}
                                        leadingIcon={option.icon}
                                    />
                                ))}
                            </Menu>
                        </>
                    )}
                </> : <View style={{ width: 48 }} />}
        </Appbar.Header>
    );
};
