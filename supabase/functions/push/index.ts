import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import * as OneSignal from "https://esm.sh/@onesignal/node-onesignal@1.0.0-beta7";

const _OnesignalAppId_ = Deno.env.get("EXPO_PUBLIC_ONESIGNAL_APP_ID")!;
const _OnesignalUserAuthKey_ = Deno.env.get("USER_AUTH_KEY")!;
const _OnesignalRestApiKey_ = Deno.env.get("ONESIGNAL_REST_API_KEY")!;
const configuration = OneSignal.createConfiguration({
  userKey: _OnesignalUserAuthKey_,
  appKey: _OnesignalRestApiKey_,
});

const onesignal = new OneSignal.DefaultApi(configuration);

serve(async (req) => {
  try {
    const { record } = await req.json();
    console.log("_OnesignalAppId_", _OnesignalAppId_);
    console.log("_OnesignalUserAuthKey_", _OnesignalUserAuthKey_);
    console.log("_OnesignalRestApiKey_", _OnesignalRestApiKey_);

    const notification = new OneSignal.Notification();
    notification.app_id = _OnesignalAppId_;
    notification.included_segments = ["Total Subscriptions"];
    notification.icon =
      "https://fifeapp.netlify.app/assets/assets/images/logo.9872a6bdff4241d2d4d04301a4623622.png";
    notification.url = "https://fifeapp.netlify.app/events/" + record.id;
    notification.contents = {
      en: `Új esemény: ${record.title}!`,
    };
    const onesignalApiRes = await onesignal.createNotification(notification);

    console.log(onesignalApiRes);

    return new Response(
      JSON.stringify({ onesignalResponse: onesignalApiRes }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Failed to create OneSignal notification", err);
    return new Response("Server error.", {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
