import ContactsCard from "@/components/buziness/ContactsCard";
import { ThemedText } from "@/components/ThemedText";
import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { Tables } from "@/database.types";
import { useHelpContacts } from "@/hooks/useHelpContacts";
import helpContactToContacts from "@/lib/functions/helpContactToContacts";
import React, { useMemo, useState } from "react";
import { Linking, ScrollView, View } from "react-native";
import { ActivityIndicator, Dialog, Icon, Portal, Surface, TextInput, TouchableRipple } from "react-native-paper";

export default function GetHelp() {
  const theme = useAppTheme();
  const { contacts, loading } = useHelpContacts();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Tables<"help_contacts"> | null>(null);

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("hu-HU");
    if (!query) return contacts;
    return contacts.filter((contact) =>
      contact.title.toLocaleLowerCase("hu-HU").includes(query) ||
      (contact.description ?? "").toLocaleLowerCase("hu-HU").includes(query)
    );
  }, [contacts, search]);

  const selectedContacts = useMemo(
    () => (selected ? helpContactToContacts(selected) : []),
    [selected]
  );

  return (
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
            <Icon source="phone-alert" size={28} color={theme.colors.onErrorContainer} />
            <View style={{ flex: 1 }}>
              <ThemedText type="bold" style={{ color: theme.colors.onErrorContainer }}>
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
        right={search.length > 0 ? <TextInput.Icon icon="close" onPress={() => setSearch("")} /> : undefined}
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
                <TouchableRipple onPress={() => setSelected(contact)}>
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
                      <Icon source="lifebuoy" size={20} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText variant="bodyMedium">{contact.title}</ThemedText>
                      {contact.description ? (
                        <ThemedText
                          variant="labelSmall"
                          style={{ color: theme.colors.onSurfaceVariant, marginTop: Spacing.xs }}
                          numberOfLines={2}
                        >
                          {contact.description}
                        </ThemedText>
                      ) : null}
                    </View>
                    <Icon source="chevron-right" size={20} color={theme.colors.outline} />
                  </View>
                </TouchableRipple>
              </React.Fragment>
            ))}
          </Surface>
        )}
      </View>

      <Portal>
        <Dialog visible={!!selected} onDismiss={() => setSelected(null)}>
          <Dialog.Title>{selected?.title}</Dialog.Title>
          <Dialog.Content>
            {selected?.description ? (
              <ThemedText style={{ marginBottom: Spacing.md }}>{selected.description}</ThemedText>
            ) : null}
            {selectedContacts.length > 0 && <ContactsCard contacts={selectedContacts} />}
          </Dialog.Content>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}
