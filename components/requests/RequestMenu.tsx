import { supabase } from "@/lib/supabase/supabase";
import { removeRequestImages } from "@/lib/requests/requestImages";
import { trackEvent } from "@/lib/analytics";
import { addSnack, showDialog } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import type { RequestItem } from "@/lib/requests/types";
import { useState } from "react";
import { IconButton, Menu, Portal } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { useAppTheme } from "@/assets/theme";
import ReportContentModal from "../user/ReportContentModal";
import BlockUserModal from "../user/BlockUserModal";

type MenuRequest = Pick<
  RequestItem,
  "id" | "author" | "author_name" | "title" | "description" | "images" | "status"
>;

interface RequestMenuProps {
  request: MenuRequest;
  /** The request is gone (deleted by me); drop it from the screen. */
  onDeleted?: () => void;
  /** The author is blocked; drop their requests from the screen. */
  onBlocked?: () => void;
  /** I marked it solved. */
  onSolved?: () => void;
}

/**
 * Marks a request solved (= archived). Shared by the menu and the detail page's button so
 * both ask the same question and handle the same errors.
 */
export function useSolveRequest(onSolved?: () => void) {
  const dispatch = useDispatch();
  return (request: Pick<RequestItem, "id" | "title">) => {
    dispatch(
      showDialog({
        title: "Megoldódott?",
        text: `„${request.title}” archiválódik: kikerül a listákból, de a megoldottak között megtalálod.`,
        submitText: "Megoldva",
        onSubmit: async () => {
          const { error } = await supabase
            .from("requests")
            .update({ status: "solved" })
            .eq("id", request.id);
          if (error) {
            dispatch(addSnack({ title: "Nem sikerült megjelölni. Próbáld újra később." }));
            return;
          }
          trackEvent("request_solved");
          dispatch(addSnack({ title: "Örülünk, hogy megoldódott!" }));
          onSolved?.();
        },
      }),
    );
  };
}

/** ⋮ menu of a request: mark solved / delete for the author, report / block for everyone else. */
const RequestMenu = ({ request, onDeleted, onBlocked, onSolved }: RequestMenuProps) => {
  const dispatch = useDispatch();
  const theme = useAppTheme();
  const uid = useSelector((state: RootState) => state.user.uid);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const solve = useSolveRequest(onSolved);

  const mine = !!uid && request.author === uid;

  const confirmDelete = () => {
    dispatch(
      showDialog({
        title: "Törlöd a kérést?",
        text: "A kommentekkel együtt törlődik, nem fogod tudni visszavonni!",
        submitText: "Törlés",
        onSubmit: async () => {
          const { error } = await supabase.from("requests").delete().eq("id", request.id);
          if (error) {
            dispatch(addSnack({ title: "Nem sikerült törölni. Próbáld újra később." }));
            return;
          }
          removeRequestImages(request.images ?? []);
          trackEvent("request_deleted");
          dispatch(addSnack({ title: "Törölted a kérést." }));
          onDeleted?.();
        },
      }),
    );
  };

  if (!uid) return null;

  return (
    <>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <IconButton
            testID={`request-menu-${request.id}`}
            icon="dots-vertical"
            size={20}
            accessibilityLabel="További lehetőségek"
            iconColor={theme.colors.onSurfaceVariant}
            onPress={() => setMenuVisible(true)}
            style={{ margin: 0 }}
          />
        }
      >
        {mine ? (
          <>
            {request.status === "open" && (
              <Menu.Item
                leadingIcon="check-circle-outline"
                title="Megoldva"
                onPress={() => {
                  setMenuVisible(false);
                  solve(request);
                }}
              />
            )}
            <Menu.Item
              leadingIcon="delete"
              title="Törlés"
              onPress={() => {
                setMenuVisible(false);
                confirmDelete();
              }}
            />
          </>
        ) : (
          <>
            <Menu.Item
              leadingIcon="alert-octagon"
              title="Jelentés"
              onPress={() => {
                setMenuVisible(false);
                setReporting(true);
              }}
            />
            <Menu.Item
              leadingIcon="account-cancel"
              title="Felhasználó letiltása"
              onPress={() => {
                setMenuVisible(false);
                setBlocking(true);
              }}
            />
          </>
        )}
      </Menu>

      <Portal>
        <ReportContentModal
          show={reporting}
          setShow={(show) => {
            if (!show) setReporting(false);
          }}
          targetType="request"
          targetId={request.id}
          reportedUserId={request.author}
          label={request.author_name ?? ""}
          excerpt={[request.title, request.description].filter(Boolean).join("\n")}
        />
        <BlockUserModal
          show={blocking}
          setShow={(show) => {
            if (!show) setBlocking(false);
          }}
          profileId={request.author}
          profileName={request.author_name ?? "Ez a felhasználó"}
          onBlocked={() => {
            setBlocking(false);
            onBlocked?.();
          }}
        />
      </Portal>
    </>
  );
};

export default RequestMenu;
