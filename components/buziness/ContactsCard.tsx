import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { Tables } from "@/database.types";
import getLinkForContact from "@/lib/functions/getLinkForContact";
import typeToIcon from "@/lib/functions/typeToIcon";
import typeToValueLabel from "@/lib/functions/typeToValueLabel";
import { addSnack } from "@/redux/reducers/infoReducer";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React from "react";
import { Linking, View } from "react-native";
import { Icon, Surface, Text, TouchableRipple } from "react-native-paper";
import { useDispatch } from "react-redux";

interface ContactsCardProps {
  contacts: Tables<"contacts">[];
  isOwnProfile?: boolean;
}

export default function ContactsCard({ contacts, isOwnProfile }: ContactsCardProps) {
  const theme = useAppTheme();
  const dispatch = useDispatch();

  return (
    <Surface
      style={{
        borderRadius: BorderRadius.lg,
        overflow: "hidden",
        width: "100%",
      }}
      elevation={1}
    >
      {contacts.map((contact, index) => (
        <React.Fragment key={contact.id}>
          {index > 0 && (
            <View
              style={{
                height: 1,
                backgroundColor: theme.colors.outlineVariant,
                marginHorizontal: Spacing.lg,
              }}
            />
          )}
          <TouchableRipple
            onPress={() => {
              const link = String(getLinkForContact(contact));
              console.log(link);
              
              if (!link || isOwnProfile && contact.type == "MESSAGE") return; 
              if (link[0] == "/") {
                router.push(link);
              } else {
                Linking.openURL(link).catch(() => {
                  Clipboard.setStringAsync(contact.data).then(() => {
                    dispatch(addSnack({ title: "Vágólapra másolva!" }));
                  });
                });
              }
            }}
            onLongPress={() => {
              Clipboard.setStringAsync(contact.data).then(() => {
                dispatch(addSnack({ title: "Vágólapra másolva!" }));
              });
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: Spacing.md,
                paddingHorizontal: Spacing.lg,
                gap: Spacing.md,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: BorderRadius.full,
                  backgroundColor: theme.colors.surfaceVariant,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon
                  source={typeToIcon(contact.type)}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" numberOfLines={1}>
                  {contact.type === "MESSAGE"
                    ? (isOwnProfile ? "A közvetlen üzenet engedélyezve van" : "Kattints a beszélgetéshez")
                    : contact.data}
                </Text>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {contact.title || typeToValueLabel(contact.type)}
                </Text>
              </View>
              {contact.type !== "MESSAGE" && <Icon source="open-in-new" size={16} color={theme.colors.outline} />}
            </View>
          </TouchableRipple>
        </React.Fragment>
      ))}
    </Surface>
  );
}
