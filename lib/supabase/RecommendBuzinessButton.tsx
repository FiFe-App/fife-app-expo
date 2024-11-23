import { useState } from "react";
import { Button } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { supabase } from "./supabase";
import { addDialog } from "@/redux/reducers/infoReducer";
import { trackPromise } from "react-promise-tracker";
import wrapper from "../functions/wrapper";

interface RecommendBuzinessButtonProps {
  buzinessId: number;
  recommended?: boolean;
  setRecommended: React.Dispatch<React.SetStateAction<boolean>>;
  style?: any;
}

export const RecommendBuzinessButton = ({
  buzinessId,
  recommended,
  setRecommended,
  style,
}: RecommendBuzinessButtonProps) => {
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const toggleRecommendation = async () => {
    if (!myUid) return;
    if (recommended) {
      dispatch(
        addDialog({
          title: "Mégsem támogatod?",
          text: "Törölheted az ajánlásod, ha meggondoltad magad.",
          onSubmit: () => {
            setLoading(true);
            trackPromise(
              wrapper<null, any>(
                supabase
                  .from("buzinessRecommendations")
                  .delete()
                  .eq("buziness_id", buzinessId)
                  .eq("author", myUid)
                  .then((res) => {
                    setRecommended(false);
                    setLoading(false);
                  }),
              ),
              "deleteRecommendation",
            );
          },
          submitText: "Törlés",
        }),
      );
    } else {
      dispatch(
        addDialog({
          title: "Bizotsan megbízol benne?",
          text: "Csak akkor jelöld őt megbízhatónak, ha úgy gondolod, hogy nem fog mást átverni.",
          onSubmit: () => {
            setLoading(true);
            trackPromise(
              wrapper<null, any>(
                supabase
                  .from("buzinessRecommendations")
                  .insert({
                    author: myUid,
                    buziness_id: buzinessId,
                  })
                  .then((res) => {
                    if (!res.error) setRecommended(true);
                    setLoading(false);
                  }),
              ),
              "deleteRecommendation",
            );
          },
          submitText: "Törlés",
        }),
      );
    }
  };

  return (
    <Button
      onPress={toggleRecommendation}
      style={style}
      mode={!recommended ? "contained" : "contained-tonal"}
      loading={loading}
    >
      {recommended ? "Már megbízom benne." : "Megbízhatónak jelölöm"}
    </Button>
  );
};
