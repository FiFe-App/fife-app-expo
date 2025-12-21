import React from "react";
import { View } from "react-native";
import { Menu, Button, Icon } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setLanguage } from "@/redux/reducers/languageReducer";
import { RootState } from "@/redux/store";

interface LanguageSwitcherProps {
  variant?: "button" | "icon";
}

export default function LanguageSwitcher({ variant = "button" }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const currentLanguage = useSelector((state: RootState) => state.language.language);
  const [visible, setVisible] = React.useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const changeLanguage = (lng: "en" | "hu") => {
    dispatch(setLanguage(lng));
    closeMenu();
  };

  const languageLabel = currentLanguage === "hu" ? "Magyar" : "English";

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
        title="Magyar"
        leadingIcon={currentLanguage === "hu" ? "check" : undefined}
      />
      <Menu.Item
        onPress={() => changeLanguage("en")}
        title="English"
        leadingIcon={currentLanguage === "en" ? "check" : undefined}
      />
    </Menu>
  );
}
