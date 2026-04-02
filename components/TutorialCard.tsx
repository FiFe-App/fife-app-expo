import { ReactNode, useState } from "react";
import { Card, IconButton } from "react-native-paper";
import { Spacing } from "@/constants/spacing";

interface TutorialCardProps {
  title: string;
  children: ReactNode;
}

const TutorialCard = ({ title, children }: TutorialCardProps) => {
  const [show, setShow] = useState(true);

  if (show)
    return (
      <Card style={{ margin: Spacing.xs }}>
        <Card.Title
          title={title}
          right={() => (
            <IconButton icon="close" onPress={() => setShow(false)} />
          )}
        />
        <Card.Content>{children}</Card.Content>
      </Card>
    );
};

export default TutorialCard;
