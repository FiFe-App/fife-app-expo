import { ThemedText } from "@/components/ThemedText";
import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { Tables } from "@/database.types";
import { useHelpContacts } from "@/hooks/useHelpContacts";
import getLinkForHelpContact from "@/lib/functions/getLinkForHelpContact";
import typeToIcon from "@/lib/functions/typeToIcon";
import { addSnack } from "@/redux/reducers/infoReducer";
import * as Clipboard from "expo-clipboard";
import React, { useMemo, useState } from "react";
import { Linking, ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  FAB,
  Icon,
  Surface,
  Text,
  TextInput,
  TouchableRipple,
} from "react-native-paper";
import { useDispatch } from "react-redux";
import AddHelpContactDialog from "@/components/user/AddHelpContactDialog";

export default function GetHelp() {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const { contacts, loading } = useHelpContacts();
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("hu-HU");
    if (!query) return contacts;
    return contacts.filter(
      (contact) =>
        contact.title.toLocaleLowerCase("hu-HU").includes(query) ||
        (contact.description ?? "").toLocaleLowerCase("hu-HU").includes(query),
    );
  }, [contacts, search]);

  const handleContactPress = (contact: Tables<"help_contacts">) => {
    const link = getLinkForHelpContact(contact);
    if (!link) return;
    Linking.openURL(link).catch(() => {
      Clipboard.setStringAsync(contact.data).then(() => {
        dispatch(addSnack({ title: "Vágólapra másolva!" }));
      });
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md }}>
        <Surface
          style={{ borderRadius: BorderRadius.lg, overflow: "hidden" }}
          elevation={1}
        >
          <TouchableRipple onPress={() => Linking.openURL("tel:112")}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.md,
                paddingVertical: Spacing.md,
                paddingHorizontal: Spacing.lg,
                backgroundColor: theme.colors.errorContainer,
              }}
            >
              <Icon
                source="phone-alert"
                size={28}
                color={theme.colors.onErrorContainer}
              />
              <View style={{ flex: 1 }}>
                <ThemedText
                  type="bold"
                  style={{ color: theme.colors.onErrorContainer }}
                >
                  Vészhelyzetben hívd a 112-t
                </ThemedText>
              </View>
            </View>
          </TouchableRipple>
        </Surface>

        <TextInput
          mode="outlined"
          placeholder="Keress a segélyvonalak között..."
          value={search}
          onChangeText={setSearch}
          left={<TextInput.Icon icon="magnify" />}
          right={
            search.length > 0 ? (
              <TextInput.Icon icon="close" onPress={() => setSearch("")} />
            ) : undefined
          }
          style={{ marginTop: Spacing.lg }}
        />

        <View style={{ marginTop: Spacing.lg }}>
          {loading ? (
            <ActivityIndicator style={{ marginTop: Spacing.xl }} />
          ) : filteredContacts.length === 0 ? (
            <ThemedText style={{ textAlign: "center", marginTop: Spacing.xl }}>
              Nincs a keresésnek megfelelő találat.
            </ThemedText>
          ) : (
            <Surface
              style={{ borderRadius: BorderRadius.lg, overflow: "hidden" }}
              elevation={1}
            >
              {filteredContacts.map((contact, index) => (
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
                    onPress={() => handleContactPress(contact)}
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
                        <ThemedText variant="bodyMedium">
                          {contact.title}
                        </ThemedText>
                        <ThemedText variant="labelSmall" type="link">
                          {contact.data}
                        </ThemedText>
                        {contact.description ? (
                          <ThemedText
                            variant="labelSmall"
                            style={{
                              color: theme.colors.onSurfaceVariant,
                              marginTop: Spacing.xs,
                            }}
                          >
                            {contact.description}
                          </ThemedText>
                        ) : null}
                      </View>
                      <Icon
                        source="open-in-new"
                        size={16}
                        color={theme.colors.outline}
                      />
                    </View>
                  </TouchableRipple>
                </React.Fragment>
              ))}
            </Surface>
          )}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        label="Segélyvonal"
        style={{ position: "absolute", bottom: Spacing.lg, right: Spacing.lg }}
        onPress={() => setShowAddDialog(true)}
      />

      <AddHelpContactDialog show={showAddDialog} setShow={setShowAddDialog} />
    </View>
  );
}
