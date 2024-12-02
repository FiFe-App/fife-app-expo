import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Enums, Tables } from "@/database.types";
import typeToIcon from "@/lib/functions/typeToIcon";
import wrapper from "@/lib/functions/wrapper";
import { addDialog, setOptions } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { supabase } from "@/lib/supabase/supabase";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import {
  Button,
  Divider,
  Headline,
  Icon,
  List,
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
import typeToPlaceholder from "@/lib/functions/typeToPlaceholder";
import typeToPrefix from "@/lib/functions/typeToPrefix";
import typeToValueLabel from "@/lib/functions/typeToValueLabel";
import edit from "@/app/user/edit";

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
    console.log(id);

    if (uid && id && id !== "index")
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
        : "Csak az láthatja majd a részleteit, akinek külön engedélyezed.";
      const onSubmit = () => {
        router.navigate({ pathname: "/user" });
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
              Ez egy olyan adat, ami megjelenik a profilodon illetve a
              bizniszeid oldalán. {"\n"}Ez alapján tudnak majd elérni mások.
            </Text>
          </TutorialCard>
          <Dropdown
            label="Típus"
            options={types}
            value={contact?.type}
            CustomDropdownInput={({
              placeholder,
              selectedLabel,
              label,
              rightIcon,
            }: DropdownInputProps) => (
              <TextInput
                placeholder={placeholder}
                label={label}
                value={selectedLabel}
                right={rightIcon}
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
            label={typeToValueLabel(contact?.type)}
            value={contact?.data}
            disabled={loading || !contact.type}
            left={typeToPrefix(contact?.type)}
            placeholder={typeToPlaceholder(contact?.type)}
            onChangeText={(t) => setContact({ ...contact, data: t })}
          />
          <TextInput
            value={contact?.title || ""}
            disabled={loading}
            label="Leírás (opcionális)"
            onChangeText={(t) => setContact({ ...contact, title: t })}
          />
          <TouchableRipple
            disabled={loading}
            onPressOut={(e) =>
              setContact({ ...contact, public: !contact.public })
            }
          >
            <View style={{ flexDirection: "row", padding: 16 }}>
              <Text style={{ flex: 1 }}>Publikus legyen?</Text>
              <Switch
                style={{ marginHorizontal: 16 }}
                disabled={loading}
                value={contact?.public || false}
              />
            </View>
          </TouchableRipple>
          <View style={{ padding: 16 }}>
            <Text>
              Ha nem publikus az elérhetőséged akkor csak te engedélyezheted,
              hogy ki lássa.
            </Text>
          </View>
          <View style={{ padding: 16, gap: 8 }}>
            <Text>
              Így fog megjelenni{" "}
              {contact.public ? "másoknak" : "akinek engedélyezed"}:
            </Text>
            <List.Item
              title={contact.title || contact.data}
              onPress={() => {}}
              left={(props) => (
                <List.Icon {...props} icon={typeToIcon(contact.type)} />
              )}
            />
          </View>
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
