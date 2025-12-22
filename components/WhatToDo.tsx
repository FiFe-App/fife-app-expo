import React, { useState, useEffect } from "react";
import { View, FlatList, Pressable, TextStyle } from "react-native";
import { Portal, Modal, Appbar, Divider, Text, Button } from "react-native-paper";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import style from "./styles";
import { Link } from "expo-router";
import type { Href } from "expo-router";
import { useTranslation } from "react-i18next";

interface FeatureItem {
  title: string;
  description: string;
  links?: { title: string; url: string }[];
}

interface WhatToDoProps {
  visible: boolean;
  onDismiss: () => void;
}

// Very lightweight markdown renderer (bold + italic + line breaks)
function renderMarkdown(md: string) {
  const paragraphs = md.split(/\n\n+/);
  return paragraphs.map((p, i) => {
    const parts: Array<{ text: string; style?: TextStyle; key: string }> = [];
    let remaining = p;
    let idx = 0;
    // Handle bold **text** and italic *text*
    const regex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(p))) {
      const matchText = match[0];
      const start = match.index;
      const before = remaining.slice(0, start - idx);
      if (before) parts.push({ text: before, key: `${i}-b-${start}` });
      const content = matchText.replace(/^\*\*?|\*$/g, "").replace(/^\*\*|\*\*$/g, "").replace(/^\*|\*$/g, "");
      const isBold = /^\*\*.*\*\*$/.test(matchText);
      const isItalic = /^\*.*\*$/.test(matchText) && !isBold;
      parts.push({
        text: content,
        style: { fontWeight: isBold ? "bold" : undefined, fontStyle: isItalic ? "italic" : undefined },
        key: `${i}-m-${start}`,
      });
      idx = start + matchText.length;
      remaining = p.slice(idx);
    }
    if (remaining) parts.push({ text: remaining, key: `${i}-r` });

    return (
      <Text key={i} style={{ marginBottom: 8, lineHeight: 20 }}>
        {parts.map((part) => (
          <Text key={part.key} style={part.style}>{part.text}</Text>
        ))}
      </Text>
    );
  });
}

export const WhatToDo: React.FC<WhatToDoProps> = ({ visible, onDismiss }) => {
  const [selected, setSelected] = useState<FeatureItem | null>(null);
  const { t } = useTranslation();

  const data = (t("whatToDo.features", { returnObjects: true }) as unknown as FeatureItem[]) || [];
  useEffect(() => {
    if (!visible) setSelected(null);
  }, [visible]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {
          setSelected(null);
          onDismiss();
        }}
        style={{ alignItems: "center" }}
        contentContainerStyle={[{ width: "92%", maxHeight: "90%" }]}
      >
        <ThemedView style={[style.containerStyle, { padding: 0, overflow: "hidden" }]}>          
          <Appbar.Header elevated={false} style={{ backgroundColor: "transparent" }}>
            {selected && (
              <Appbar.BackAction onPress={() => setSelected(null)} />
            )}
            <Appbar.Content title={selected ? selected.title : t("whatToDo.title")} />
            <Appbar.Action icon="close" onPress={() => { setSelected(null); onDismiss(); }} />
          </Appbar.Header>
          <Divider />
          {!selected && (
            <FlatList
              data={data}
              keyExtractor={(item) => item.title}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelected(item)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: pressed ? "rgba(0,0,0,0.05)" : "transparent",
                  })}
                >
                  <ThemedText variant="titleMedium" style={{ fontWeight: "600" }}>{item.title}</ThemedText>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <Divider />}
              contentContainerStyle={{ paddingBottom: 8 }}
            />
          )}
          {selected && (
            <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
              <View style={{ marginBottom: 12 }}>{renderMarkdown(selected.description)}</View>
              {selected.links && selected.links.length > 0 && (
                <View style={{ marginBottom: 16, flexWrap:"wrap" }}>
                  {selected.links.map((l) => 
                    (<Link asChild key={l.url} href={l.url as unknown as Href} style={{ marginBottom: 6 }}>
                      <Button onPress={()=>onDismiss()}
                        mode="contained">{l.title}</Button>
                    </Link>
                    ))}
                </View>
              )}
            </View>
          )}
        </ThemedView>
      </Modal>
    </Portal>
  );
};

export default WhatToDo;
