import { ThemedText } from "@/components/ThemedText";
import { Enums, Tables } from "@/database.types";
import typeToPlaceholder from "@/lib/functions/typeToPlaceholder";
import typeToPrefix from "@/lib/functions/typeToPrefix";
import typeToValueLabel from "@/lib/functions/typeToValueLabel";
import wrapper from "@/lib/functions/wrapper";
import { supabase } from "@/lib/supabase/supabase";
import { addDialog, setOptions } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { router, useFocusEffect } from "expo-router";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { trackPromise } from "react-promise-tracker";
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

type IContact = Optional<Tables<"contacts">, "id"> | undefined;

const ContactEditScreen = forwardRef<{ saveContacts: () => void }>(
  (_props, ref) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{
      type: Enums<"contact_type">;
      text: string;
    } | null>(null);
    const { uid, userData } = useSelector((state: RootState) => state.user);
    const dispatch = useDispatch();
    const [contacts, setContacts] = useState<IContact[]>([]);
    const loadContacts = () => {
      if (uid)
        supabase
          .from("contacts")
          .select("*")
          .eq("author", uid)
          .then((res) => {
            if (res.data?.length) setContacts(res.data);
            setLoading(false);
          });
    };
    console.log(contacts);

    useFocusEffect(
      useCallback(() => {
        loadContacts();
        setError(null);
        return () => {};
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [uid, dispatch]),
    );

    const saveContact = (c_ind: number, contact: Partial<IContact>) => {
      if (uid === undefined) return;
      const newArray = types
        .map((type, ind) => {
          const current = contacts.find((c) => c?.type === type.value);
          if (c_ind === ind) {
            return {
              type: type.value,
              author: uid,
              data: contact?.data || "",
              created_at: current?.created_at || new Date().toISOString(),
              ...current,
              ...contact,
            };
          } else return current;
        })
        .filter((item): item is NonNullable<typeof item> => item !== undefined);
      setContacts(newArray);
    };
    const save = async () => {
      const invalid = contacts.find((c) => c && !c.data && !!c.title);
      console.log("invalid", invalid);

      if (invalid) {
        setError({ type: invalid.type, text: "Töltsd ki ezt a mezőt." });
        return { error: "Invalid field" };
      }
      const noNullContacts = contacts.filter((c) => !!c && c.data.length);
      const deletableIds = contacts
        .filter((c) => !!c && ((c.title && !c.data) || !c.data))
        .map((c) => c?.id);

      if (uid && contacts.length) {
        const response = await supabase
          .from("contacts")
          .upsert(noNullContacts, {
            onConflict: "id",
            defaultToNull: false,
          });
        console.log("TO DEL", deletableIds);

        const del_response = await supabase
          .from("contacts")
          .delete()
          .in("id", deletableIds);
        console.log("del", del_response);

        return response;
      }
    };
    useImperativeHandle(ref, () => ({
      async saveContacts() {
        return await save();
      },
    }));
    return (
      <View style={{ flex: 1, gap: 8 }}>
        {types.map((type, ind) => {
          const current = {
            title: "",
            data: "",
            ...contacts.find((c) => c?.type === type.value),
          };
          if (!loading)
            return (
              <View key={ind}>
                <ThemedText type="label">{type.label} elérhetőséged</ThemedText>
                <TextInput
                  label={typeToValueLabel(type?.value)}
                  value={current?.data}
                  disabled={loading || !type.label}
                  left={typeToPrefix(type?.value)}
                  placeholder={typeToPlaceholder(type.value)}
                  onChangeText={(t) => saveContact(ind, { data: t })}
                  error={error?.type === type.value}
                />
                <TextInput
                  value={current?.title || ""}
                  disabled={loading}
                  label="Leírás (opcionális)"
                  onChangeText={(t) => saveContact(ind, { title: t })}
                />
                {error?.type === type.value && (
                  <ThemedText type="error" style={{ marginLeft: 16 }}>
                    {error?.text}
                  </ThemedText>
                )}
                {type.value === "EMAIL" && (
                  <Button
                    onPress={() => saveContact(ind, { data: userData?.email })}
                  >
                    Regisztrációnál használt email használata
                  </Button>
                )}
              </View>
            );
        })}
      </View>
    );
  },
);
ContactEditScreen.displayName = "ContactEditScreen";

export default ContactEditScreen;
