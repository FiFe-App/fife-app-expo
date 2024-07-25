import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import axios from "axios";
import { useSelector } from "react-redux";

const AxiosDefaultHeaders = () => {
  const { userData }: UserState = useSelector((state: RootState) => state.user);
  axios.defaults.headers.common.Authorization = userData?.authorization;
  axios.defaults.baseURL = "http://localhost:8888/.netlify/functions/index";

  return null;
};

export default AxiosDefaultHeaders;
