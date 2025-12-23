import { useState } from "react";
import { Button } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { supabase } from "./supabase";
import { addDialog } from "@/redux/reducers/infoReducer";
import { trackPromise } from "react-promise-tracker";
import wrapper from "../functions/wrapper";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
          title: t("dialogs.recommendBizinessRemove.title"),
          text: t("dialogs.recommendBizinessRemove.text"),
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
          submitText: t("dialogs.recommendBizinessRemove.submit"),
        }),
      );
    } else {
      dispatch(
        addDialog({
          title: t("dialogs.recommendBizinessAdd.title"),
          text: t("dialogs.recommendBizinessAdd.text"),
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
          submitText: t("dialogs.recommendBizinessAdd.submit"),
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
      {recommended ? t("dialogs.recommendBizinessButton.recommended") : t("dialogs.recommendBizinessButton.recommend")}
    </Button>
  );
};
