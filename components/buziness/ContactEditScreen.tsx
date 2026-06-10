import { ThemedText } from "@/components/ThemedText";
import { Enums, Tables } from "@/database.types";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import typeToIcon from "@/lib/functions/typeToIcon";
import typeToPlaceholder from "@/lib/functions/typeToPlaceholder";
import typeToPrefix from "@/lib/functions/typeToPrefix";
import typeToValueLabel from "@/lib/functions/typeToValueLabel";
import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { addSnack } from "@/redux/reducers/infoReducer";
import { Link, useFocusEffect } from "expo-router";
import React, {
  useCallback,
  useImperativeHandle,
  useState,
  useEffect,
  forwardRef,
} from "react";
import { Icon, Switch, TextInput, Button, Menu, IconButton } from "react-native-paper";
import { StyleProp, View, ViewStyle } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";

const types: {
  label: string;
  value: Enums<"contact_type">;
}[] = [
  { label: "Telefonszám", value: "TEL" },
  { label: "Email-cím", value: "EMAIL" },
  { label: "Webhely", value: "WEB" },
  { label: "Instagram", value: "INSTAGRAM" },
  { label: "Facebook", value: "FACEBOOK" },
  { label: "Cím/Hely", value: "PLACE" },
  { label: "Közvetlen üzenet", value: "MESSAGE" },
  { label: "Más", value: "OTHER" },
];

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

type IContact = Optional<Tables<"contacts">, "id">;

type ContactEditScreenProps = {
  onContactsChange?: (contacts: IContact[]) => void;
  style?: StyleProp<ViewStyle>;
  defaultContactId?: number;
  onDefaultContactChange?: (id: number | undefined) => void;
  showFeaturedToggle?: boolean;
};

const ContactEditScreen = forwardRef<{
  saveContacts: () => Promise<
    | PostgrestSingleResponse<any>
    | { error: string; }
    | undefined>;
}, ContactEditScreenProps>((props, ref) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    type: Enums<"contact_type">;
    text: string;
  } | null>(null);
  const { uid } = useSelector((state: RootState) => state.user);
  const theme = useAppTheme();

  const dispatch = useDispatch();
  const [contacts, setContacts] = useState<IContact[]>([]);
  const [buzinessCount, setBuzinessCount] = useState(0);
  const [revealedTypes, setRevealedTypes] = useState<Enums<"contact_type">[]>([
    "MESSAGE",
  ]);
  const [addMenuVisible, setAddMenuVisible] = useState(false);
  const loadContacts = () => {
    if (!uid) return;
    Promise.all([
      supabase.from("contacts").select("*").eq("author", uid),
      supabase
        .from("buziness")
        .select("id", { count: "exact", head: true })
        .eq("author", uid),
    ]).then(([contactsRes, buzinessRes]) => {
      if (contactsRes.data?.length) {
        setContacts(contactsRes.data);
        setRevealedTypes((prev) => {
          const next = new Set<Enums<"contact_type">>(prev);
          next.add("TEL");
          contactsRes.data.forEach((c) => {
            if (c.data && c.data.length > 0) next.add(c.type);
          });
          return Array.from(next);
        });
      }
      setBuzinessCount(buzinessRes.count || 0);
      setLoading(false);
    });
  };

  useEffect(() => {
    props.onContactsChange?.(contacts);
  }, [contacts, props]);

  useFocusEffect(
    useCallback(() => {
      loadContacts();
      setError(null);
      return () => { };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid, dispatch]),
  );

  const saveContact = (c_ind: number, contact: Partial<IContact>) => {
    if (uid === undefined) return;

    const newArray = types
      .map((type, ind) => {
        const current = contacts.find((c) => c?.type === type.value);

        if (c_ind === ind) {
          const newContact = {
            data: "",
            title: null,
            ...current,
            ...contact,
            type: type.value,
            author: uid,
            public: true,
            created_at: current?.created_at || new Date().toISOString(),
          };
          return newContact;
        } else return current;
      })
      .filter((item): item is NonNullable<typeof item> => item !== undefined);
    setContacts(newArray);
  };
  const save = async () => {
    const invalid = contacts.find((c) => c && !c.data && !!c.title);
    console.log("invalid", invalid);

    if (invalid) {
      setError({ type: invalid.type, text: "Nem maradhat üresen." });
      return { error: "Invalid field" };
    }
    const noNullContacts = contacts.filter((c) => !!c && c.data.length);

    // Prevent deletion if it would leave user with no contacts
    if (noNullContacts.length === 0 && buzinessCount > 0) {
      setError({ type: contacts[0]?.type || "TEL", text: "Legalább egy elérhetőséget kötelező megadni ha már van bizniszed." });
      dispatch(addSnack({ title: "Legalább egy elérhetőséget kötelező megadni ha már van bizniszed." }));
      return { error: "At least one contact is required" };
    }

    if (uid && contacts.length) {
      // Find contacts where both value and title are empty, and delete them

      const deletableIds: number[] = contacts
        .filter((c) => c !== undefined && (!c.data || c.data === "") && (!c.title || c.title === "") && typeof c.id === "number")
        .map((c) => c.id as number);

      let del_response = null;
      if (deletableIds.length > 0) {
        del_response = await supabase
          .from("contacts")
          .delete()
          .in("id", deletableIds);
        if (del_response.error) {
          console.error("Delete error:", del_response.error);
          dispatch(addSnack({ title: "Hiba a törléskor: " + del_response.error.message }));
          return { error: del_response.error.message };
        } else {
          console.log("Deleted contacts", deletableIds);
        }
      }

      const response = await supabase.from("contacts").upsert(noNullContacts, {
        onConflict: "id",
        defaultToNull: false,
      });

      return { upsert: response, delete: del_response };
    }
  };
  useImperativeHandle(ref, () => ({
    async saveContacts(): Promise<
      PostgrestSingleResponse<any> | { error: string } | undefined
    > {
      return await save();
    },
    getContacts(): IContact[] {
      return contacts;
    },
  }));
  const hiddenTypes = types.filter((t) => !revealedTypes.includes(t.value));

  return (
    <View style={[{ flex: 1, gap: Spacing.md }, props?.style]}>
      {!loading &&
        types
          .filter((type) => revealedTypes.includes(type.value))
          .map((type, ind) => {
          const current = {
            title: "",
            data: "",
            ...contacts.find((c) => c?.type === type.value),
          };
          
          // Regular contact types
          const filled = !!current.data;
          const isFeatured =
            props.showFeaturedToggle &&
            typeof current.id === "number" &&
            props.defaultContactId === current.id;
          // saveContact still expects an index into the full `types` array
          const typeIndex = types.findIndex((t) => t.value === type.value);
          return (
            <View key={type.value} style={{ gap: Spacing.xs }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.sm,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: BorderRadius.full,
                    backgroundColor: theme.colors.surfaceVariant,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconButton
                    icon={typeToIcon(type?.value)}
                    size={16}
                    iconColor={theme.colors.primary}
                    style={{ margin: 0 }}
                  />
                </View>
                <ThemedText
                  variant="bodyMedium"
                  style={{ flex: 1, color: theme.colors.onSurfaceVariant }}
                >
                  {type.label}
                </ThemedText>
                {props.showFeaturedToggle &&
                  filled &&
                  typeof current.id === "number" && (
                    <IconButton
                      icon={isFeatured ? "star" : "star-outline"}
                      size={20}
                      iconColor={
                        isFeatured
                          ? theme.colors.primary
                          : theme.colors.onSurfaceVariant
                      }
                      onPress={() => {
                        if (typeof current.id === "number") {
                          props.onDefaultContactChange?.(
                            isFeatured ? undefined : current.id,
                          );
                        }
                      }}
                      accessibilityLabel={
                        isFeatured
                          ? "Kiemelt elérhetőség eltávolítása"
                          : "Beállítás kiemelt elérhetőségként"
                      }
                    />
                  )}
              </View>
              {type.value === "MESSAGE" ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: Spacing.sm,
                  }}
                ><View  style={{flex:1}}>
                  
                    <ThemedText variant="bodyMedium">
                      {current?.data === "true" || current?.data === true
                        ? "A közvetlen üzenet engedélyezve van"
                        : typeToPlaceholder(type?.value)}
                    </ThemedText>
                </View>
                  <Switch
                    value={current?.data === "true" || current?.data === true}
                    onValueChange={(value) =>
                      saveContact(typeIndex, { data: value ? "true" : "" })
                    }
                    disabled={loading || !type.label}
                  />
                </View>
              ) : (
                <TextInput
                  mode="outlined"
                  label={typeToValueLabel(type?.value)}
                  value={current?.data}
                  disabled={loading || !type.label}
                  left={typeToPrefix(type.value)}
                  placeholder={typeToPlaceholder(type.value)}
                  onChangeText={(t) => saveContact(typeIndex, { data: t })}
                  error={error?.type === type.value}
                  contentStyle={{}}
                />
              )}
              {(!!current.data || !!current.title) && (
                <TextInput
                  mode="outlined"
                  value={current?.title || ""}
                  disabled={loading}
                  label={"Egyéb információ"}
                  placeholder="Munkanapokon keress / csak hétvégén"
                  onChangeText={(t) => saveContact(typeIndex, { title: t })}
                />
              )}
              {error?.type === type.value && (
                <ThemedText type="error" style={{ marginLeft: Spacing.xs }}>
                  {error?.text}
                </ThemedText>
              )}
            </View>
          );
        })}
      {!loading && hiddenTypes.length > 0 && (
        <Menu
          visible={addMenuVisible}
          onDismiss={() => setAddMenuVisible(false)}
          anchor={
            <Button
              icon="plus"
              mode="text"
              onPress={() => setAddMenuVisible(true)}
              style={{ alignSelf: "flex-start" }}
            >
              Új elérhetőség
            </Button>
          }
        >
          {hiddenTypes.map((t) => (
            <Menu.Item
              key={t.value}
              leadingIcon={typeToIcon(t.value)}
              title={t.label}
              onPress={() => {
                setRevealedTypes((prev) => [...prev, t.value]);
                setAddMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      )}
    </View>
  );
});
ContactEditScreen.displayName = "ContactEditScreen";

export default ContactEditScreen;
