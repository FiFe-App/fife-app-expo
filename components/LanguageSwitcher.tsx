import React from "react";
import { Menu, Button, Icon } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setLanguage } from "@/redux/reducers/languageReducer";
import { RootState } from "@/redux/store";
import { supabase } from "@/lib/supabase/supabase";

interface LanguageSwitcherProps {
  variant?: "button" | "icon";
}

export default function LanguageSwitcher({ variant = "button" }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const currentLanguage = useSelector((state: RootState) => state.language.language);
  const uid = useSelector((state: RootState) => state.user.uid);
  const [visible, setVisible] = React.useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const changeLanguage = async (lng: "en" | "hu") => {
    dispatch(setLanguage(lng));
    await i18n.changeLanguage(lng);
    
    // Store language preference in Supabase profile if user is logged in
    if (uid) {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ language: lng })
          .eq("id", uid);
        
        if (error) {
          console.error("Failed to update language in profile:", error);
        }
      } catch (error) {
        console.error("Failed to update language in profile:", error);
      }
    }
    
    closeMenu();
  };

  const languageLabel = currentLanguage === "hu" ? "🇭🇺" : "🇬🇧";

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={
        variant === "icon" ? (
          <Button onPress={openMenu} mode="text">
            <Icon source="translate" size={24} />
          </Button>
        ) : (
          <Button onPress={openMenu} mode="outlined">
            {languageLabel}
          </Button>
        )
      }
    >
      <Menu.Item
        onPress={() => changeLanguage("hu")}
        title="🇭🇺"
        leadingIcon={currentLanguage === "hu" ? "check" : undefined}
      />
      <Menu.Item
        onPress={() => changeLanguage("en")}
        title="🇬🇧"
        leadingIcon={currentLanguage === "en" ? "check" : undefined}
      />
    </Menu>
  );
}
