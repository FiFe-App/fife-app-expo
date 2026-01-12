import i18n from "@/i18n";

const typeToValueLabel = (type?: string): string => {
  switch (type) {
    case "TEL":
      return i18n.t("contactEdit.types.phone");
    case "EMAIL":
      return i18n.t("contactEdit.types.email");
    case "INSTAGRAM":
      return i18n.t("contactEdit.types.instagram");
    case "FACEBOOK":
      return i18n.t("contactEdit.types.facebook");
    case "PLACE":
      return i18n.t("contactEdit.types.place");
    case "WEB":
      return i18n.t("contactEdit.types.web");
    case "OTHER":
      return i18n.t("contactEdit.types.other");
    default:
      return i18n.t("contactEdit.selectType");
  }
};

export default typeToValueLabel;
