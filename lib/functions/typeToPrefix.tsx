import { ReactNode } from "react";
import { TextInput } from "react-native-paper";

const typeToPrefix = (type?: string): ReactNode => {
  let prefix = "";
  if (type === "INSTAGRAM") prefix = "@";
  if (type === "FACEBOOK") prefix = "facebook.com/";
  if (prefix)
    return <TextInput.Affix textStyle={{ opacity: 0.5 }} text={prefix} />;
  return null;
};

export default typeToPrefix;
