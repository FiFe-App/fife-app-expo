import { useState } from "react";
import { Button } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { UserState } from "../redux/store.type";
import { supabase } from "./supabase";
import { addDialog } from "../redux/reducers/infoReducer";
import { trackPromise } from "react-promise-tracker";
import wrapper from "../functions/wrapper";

interface RecommendProfileButtonProps {
  profileId: string;
  recommended?: boolean;
  setRecommended: React.Dispatch<React.SetStateAction<boolean>>;
  style?: any;
}

export const RecommendProfileButton = ({
  profileId,
  recommended,
  setRecommended,
  style,
}: RecommendProfileButtonProps) => {
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
          title: "Mégsem ajánlod?",
          text: "Törölheted az ajánlásod, ha meggondoltad magad.",
          onSubmit: () => {
            setLoading(true);
            trackPromise(
              wrapper<null, any>(
                supabase
                  .from("profileRecommendations")
                  .delete()
                  .eq("profile_id", profileId)
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
      const res = await supabase.from("profileRecommendations").insert({
        author: myUid,
        profile_id: profileId,
      });

      if (!res.error) setRecommended(true);
      setLoading(false);
    }
  };

  return (
    <Button
      onPress={toggleRecommendation}
      style={style}
      mode={!recommended ? "contained" : "contained-tonal"}
      loading={loading}
    >
      {recommended ? "Már a pajtásom:)" : "Pajtásnak jelölöm!"}
    </Button>
  );
};
