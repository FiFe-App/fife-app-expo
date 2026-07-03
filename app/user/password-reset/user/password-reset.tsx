import { Redirect } from "expo-router";

const RedirectToPassReset = () => {
    return (
        <Redirect href="/user/password-reset" />
    );
};

export default RedirectToPassReset;