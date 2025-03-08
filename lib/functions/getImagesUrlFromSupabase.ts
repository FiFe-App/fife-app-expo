import { ImageDataType } from "@/redux/store.type";
import { supabase } from "../supabase/supabase";

const getImagesUrlFromSupabase = (images: string[]) => {
  return images?.map((i) => {
    const parsed = JSON.parse(i);
    const imageData: ImageDataType = {
      ...parsed,
      url: supabase.storage.from("buzinessImages").getPublicUrl(parsed.path)
        .data.publicUrl,
      status: "uploaded",
    };
    return imageData;
  });
};

export default getImagesUrlFromSupabase;
