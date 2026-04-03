import { useCallback, useEffect } from "react";
import { useState } from "react";
import { Linking, Pressable, Text } from "react-native";
import { ThemedText } from "../ThemedText";
import { theme } from "@/assets/theme";

const UrlText = ({ text = "" }: { text: string }) => {
  // Matches URLs (http/https, with/without www), emails, and phone numbers
  const regex =
    /((https?:\/\/)?(www\.)?[a-zA-Z0-9\-._~%]+(\.[a-zA-Z]{2,})+([\/?#][^\s]*)?)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(\+?\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9})/g;
  const arr = text.match(regex);

  const [result, setResult] = useState<any[] | null>(null);
  const makeText = useCallback(() => {
    const list: any[] = [];
    let pre = 0;

    if (arr?.length)
      arr.map((link, ind) => {
        const start = text.indexOf(link);
        const end = start + link?.length;
        list.push(<Text key={ind + "s"}>{text.slice(pre, start)}</Text>);
        list.push(
          <Pressable key={ind + "k"}
            onPress={() => {
              Linking.openURL(text.slice(start, end));
            }}
          >
            <ThemedText style={{ color: theme.colors.secondary, }}>{text.slice(start, end)}</ThemedText>
          </Pressable>,
        );
        pre += end;
      });
    list.push(<Text key={"e"}>{text.slice(pre, text.length)}</Text>);
    setResult(list);
  }, [arr, text]);

  useEffect(() => {
    makeText();
  }, [text]);

  return <ThemedText>{result}</ThemedText>;
};

export default UrlText;
