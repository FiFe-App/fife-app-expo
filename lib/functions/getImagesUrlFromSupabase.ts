import { MediaDataType } from "@/redux/store.type";
import { supabase } from "../supabase/supabase";
import getMediaKind from "./getMediaKind";

const getImagesUrlFromSupabase = (images: string[]) => {
  return images?.map((i) => {
    const parsed = JSON.parse(i);
    const mediaData: MediaDataType = {
      ...parsed,
      mediaType: getMediaKind(parsed),
      url: supabase.storage.from("buzinessImages").getPublicUrl(parsed.path)
        .data.publicUrl,
      status: "uploaded",
    };
    return mediaData;
  });
};

export default getImagesUrlFromSupabase;
