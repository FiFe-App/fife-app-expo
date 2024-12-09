import Slider from "@react-native-community/slider";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { ThemedView } from "../ThemedView";
import { supabase } from "@/lib/supabase/supabase";
import { useEffect, useState } from "react";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { useSelector } from "react-redux";
import { ThemedText } from "../ThemedText";

interface GoingInputProps {
  eventId: number;
  value: number;
  onOuterValueChange: React.Dispatch<React.SetStateAction<number>>;
}

const GoingInput = ({
  eventId,
  value,
  onOuterValueChange,
}: GoingInputProps) => {
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const [defaultValue, setDefaultValue] = useState(0);
  useEffect(() => {
    if (eventId && uid)
      supabase
        .from("eventResponses")
        .select("*")
        .eq("user_id", uid)
        .eq("event_id", eventId)
        .single()
        .then((res) => {
          if (res.data?.value) {
            onOuterValueChange(res.data.value / 10);
            setDefaultValue(res.data.value / 10);
          }
          //setLoading(false);
        });
  }, [eventId, onOuterValueChange, uid]);

  const onValueChange = (value: number) => {
    console.log("value", value);
    onOuterValueChange(value);

    supabase
      .from("eventResponses")
      .upsert(
        {
          event_id: eventId,
          value: value * 10,
        },
        { onConflict: "event_id, user_id" },
      )
      .then((res) => {
        console.log(res);
      });
  };
  return (
    <View>
      <ThemedText>Mennyire valószínű, hogy itt leszel?</ThemedText>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 4,
        }}
      >
        <Slider
          style={{ width: "100%", height: 40 }}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor="#6750a4"
          maximumTrackTintColor="#e4e4e4"
          thumbTintColor="#6750a4"
          value={value}
          step={0.1}
          onResponderEnd={(e) => {
            e.stopPropagation();
          }}
          onSlidingComplete={onValueChange}
          //disabled={loading}
        />
      </View>
      <View style={{ flexDirection: "row" }}>
        <Text style={{ flex: 1 }}>Nem megyek</Text>
        <Text>Elmegyek</Text>
      </View>
    </View>
  );
};

export default GoingInput;
