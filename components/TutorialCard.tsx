import { ReactNode, useState } from "react";
import { Card, IconButton, Text } from "react-native-paper";

interface TutorialCardProps {
  title: string;
  children: ReactNode;
}

const TutorialCard = ({ title, children }: TutorialCardProps) => {
  const [show, setShow] = useState(true);

  if (show)
    return (
      <Card>
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
