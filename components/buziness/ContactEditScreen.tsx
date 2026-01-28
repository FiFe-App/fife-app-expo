import { ThemedText } from "@/components/ThemedText";
import { Enums, Tables } from "@/database.types";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import typeToIcon from "@/lib/functions/typeToIcon";
import typeToPlaceholder from "@/lib/functions/typeToPlaceholder";
import typeToPrefix from "@/lib/functions/typeToPrefix";
import typeToValueLabel from "@/lib/functions/typeToValueLabel";
import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { useFocusEffect } from "expo-router";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { Icon, TextInput } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

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
    { label: "Más", value: "OTHER" },
  ];

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

type IContact = Optional<Tables<"contacts">, "id">;

type ContactEditScreenProps = {
  onContactsChange?: (contacts: IContact[]) => void;
  style?: StyleProp<ViewStyle>;
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

  const dispatch = useDispatch();
  const [contacts, setContacts] = useState<IContact[]>([]);
  const [buzinessCount, setBuzinessCount] = useState(0);
  const loadContacts = () => {
    if (uid) {
      supabase
        .from("contacts")
        .select("*")
        .eq("author", uid)
        .then((res) => {
          if (res.data?.length) setContacts(res.data);
          setLoading(false);
        });

      supabase
        .from("buziness")
        .select("id", { count: "exact", head: true })
        .eq("author", uid).then((res) => {
          // If no buziness exists, prefill with one empty contact
          setBuzinessCount(res.count || 0);
        });
    }
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
  return (
    <View style={[{ flex: 1, gap: 8 }, props?.style]}>
      {!loading &&
        types.map((type, ind) => {
          const current = {
            title: "",
            data: "",
            ...contacts.find((c) => c?.type === type.value),
          };
          return (
            <View key={ind}>
              <View
                style={{
                  flexDirection: "row",
                  gap: 4,
                  paddingLeft: 16,
                  alignItems: "center",
                }}
              >
                <Icon size={16} source={typeToIcon(type?.value)} />
                <ThemedText>{type.label} elérhetőséged</ThemedText>
              </View>
              <TextInput
                label={typeToValueLabel(type?.value)}
                value={current?.data}
                disabled={loading || !type.label}
                left={typeToPrefix(type.value)}
                placeholder={typeToPlaceholder(type.value)}
                onChangeText={(t) => saveContact(ind, { data: t })}
                error={error?.type === type.value}
              />
              {(!!current.data || !!current.title) && (
                <TextInput
                  value={current?.title || ""}
                  disabled={loading}
                  label="Egyéb információ"
                  placeholder="Munkanapokon keress / csak hétvégén"
                  onChangeText={(t) => saveContact(ind, { title: t })}
                />
              )}
              {error?.type === type.value && (
                <ThemedText type="error" style={{ marginLeft: 16 }}>
                  {error?.text}
                </ThemedText>
              )}
            </View>
          );
        })}
    </View>
  );
});
ContactEditScreen.displayName = "ContactEditScreen";

export default ContactEditScreen;
