import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Enums, Tables } from "@/database.types";
import typeToIcon from "@/lib/functions/typeToIcon";
import wrapper from "@/lib/functions/wrapper";
import { addDialog, setOptions } from "@/lib/redux/reducers/infoReducer";
import { RootState } from "@/lib/redux/store";
import { supabase } from "@/lib/supabase/supabase";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import {
  Button,
  Divider,
  Headline,
  Icon,
  MD3DarkTheme,
  Switch,
  Text,
  TextInput,
  TouchableRipple,
} from "react-native-paper";
import { Dropdown, DropdownInputProps } from "react-native-paper-dropdown";
import { trackPromise } from "react-promise-tracker";
import { useDispatch, useSelector } from "react-redux";
import TutorialCard from "../TutorialCard";

const types: {
  label: string;
  value: Enums<"contact_type">;
}[] = [
  { label: "Telefonszám", value: "TEL" },
  { label: "Email-cím", value: "EMAIL" },
  { label: "Webhely", value: "WEB" },
  { label: "Más", value: "OTHER" },
];

type IContact = Partial<Tables<"contacts">>;

const ContactEditScreen = ({ id }: { id?: string }) => {
  const [loading, setLoading] = useState(false);
  const { uid } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const [contact, setContact] = useState<IContact>({
    data: "",
    title: "",
    public: true,
    author: uid,
  });
  const [error, setError] = useState<string | null>(null);

  const loadContacts = () => {
    if (uid && id)
      supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .then((res) => {
          if (res.data?.length) setContact(res.data[0]);
          else {
            setError("Nincs ilyen elérhetőség");
          }
        });
  };
  useFocusEffect(
    useCallback(() => {
      if (id)
        dispatch(
          setOptions([
            {
              title: "Törlés",
              icon: "delete",
              onPress: () => {
                dispatch(
                  addDialog({
                    title: "Elérhetőség törlése?",
                    text: "Nem fogod tudni visszavonni.",
                    onSubmit: () => {
                      setLoading(true);
                      trackPromise(
                        wrapper<null, any>(
                          supabase
                            .from("contacts")
                            .delete()
                            .eq("id", id)
                            .then((res) => {
                              setLoading(false);
                              router.navigate("/user/edit");
                            }),
                        ),
                        "deleteRecommendation",
                      );
                    },
                    submitText: "Törlés",
                  }),
                );
              },
            },
          ]),
        );
      loadContacts();
      return () => {};
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid, id, dispatch]),
  );

  const save = async () => {
    if (uid && contact.data && contact.type) {
      setLoading(true);
      await supabase.from("contacts").upsert(
        {
          ...contact,
          data: contact.data,
          type: contact.type,
          author: uid,
        },
        {
          onConflict: "id",
        },
      );
      setLoading(false);
      const text = contact.public
        ? "Bárki láthatja a részleteit az oldaladon, vagy egy bizniszed oldalán."
        : "Senki sem láthatja a részleteit.";
      const onSubmit = () => {
        router.navigate({ pathname: "/user/edit" });
      };
      dispatch(
        addDialog({
          title: "Az elérhetőséged elmentetted",
          text,
          onSubmit,
          dismissable: false,
        }),
      );
    }
  };
  return (
    <ThemedView style={{ flex: 1 }}>
      {!error && (
        <>
          <TutorialCard title="Mi az az elérhetőség?">
            <Text>
              Ezek olyan adatok, amik megjelennek a profilodon illetve a
              bizniszeid oldalán.
            </Text>
            <Text>Típus: Válassz egy típusú elérhetőséget</Text>
            <Text>Név: Ez a felirat látszik majd másoknak</Text>
            <Text>Érték: Maga az elérhetőséged</Text>
          </TutorialCard>
          <Dropdown
            label="Típus"
            placeholder="Típus"
            options={types}
            value={contact?.type}
            CustomDropdownInput={({
              placeholder,
              selectedLabel,
              rightIcon,
            }: DropdownInputProps) => (
              <TextInput
                placeholder={placeholder}
                value={selectedLabel}
                right={rightIcon}
                left={"a"}
              />
            )}
            menuContentStyle={{ left: 8 }}
            CustomDropdownItem={({
              width,
              option,
              value,
              onSelect,
              toggleMenu,
              isLast,
            }) => {
              return (
                <>
                  <TouchableRipple
                    onPress={() => {
                      onSelect?.(option.value);
                      toggleMenu();
                    }}
                  >
                    <Headline
                      style={{
                        color:
                          value === option.value
                            ? MD3DarkTheme.colors.onPrimary
                            : MD3DarkTheme.colors.primary,
                        alignItems: "center",
                        display: "flex",
                        padding: 8,
                      }}
                    >
                      <Icon source={typeToIcon(option.value)} size={22} />
                      <ThemedText style={{ marginLeft: 8 }}>
                        {option.label}
                      </ThemedText>
                    </Headline>
                  </TouchableRipple>
                  {!isLast && <Divider />}
                </>
              );
            }}
            CustomMenuHeader={(props) => <></>}
            onSelect={(t) => {
              if (t) {
                const ty = types.find((ty) => ty.value === t);
                setContact({ ...contact, type: ty?.value });
              }
            }}
          />
          <TextInput
            value={contact?.title || ""}
            disabled={loading}
            placeholder="Név"
            onChangeText={(t) => setContact({ ...contact, title: t })}
          />
          <TextInput
            value={contact?.data}
            disabled={loading}
            placeholder="Érték"
            onChangeText={(t) => setContact({ ...contact, data: t })}
          />
          <TouchableRipple
            disabled={loading}
            onPressOut={(e) =>
              setContact({ ...contact, public: !contact.public })
            }
          >
            <View style={{ flexDirection: "row", padding: 16 }}>
              <Text style={{ flex: 1 }}>Látható legyen másoknak?</Text>
              <Switch
                style={{ marginHorizontal: 16 }}
                disabled={loading}
                value={contact?.public || false}
              />
            </View>
          </TouchableRipple>
          <Button
            onPress={save}
            style={{ margin: 16 }}
            mode="contained"
            loading={loading}
            disabled={!contact?.data || !contact?.type}
          >
            Mentés
          </Button>
        </>
      )}
      {error && (
        <ThemedText style={{ textAlign: "center", padding: 16 }}>
          {error}
        </ThemedText>
      )}
    </ThemedView>
  );
};

export default ContactEditScreen;
