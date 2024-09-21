import { PostgrestSingleResponse } from "@supabase/supabase-js";

const wrapper = <T, P extends PostgrestSingleResponse<T>>(s: PromiseLike<P>) =>
  Promise.resolve(s);

export default wrapper;
