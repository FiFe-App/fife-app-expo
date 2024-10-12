import { IconSource } from "react-native-paper/lib/typescript/components/Icon";

const typeToIcon = (type: string): IconSource => {
  if (type === "TEL") return "phone";
  if (type === "EMAIL") return "email";
  if (type === "WEB") return "web";
  if (type === "OTHER") return "dots-horizontal";
  return "";
};

export default typeToIcon;
