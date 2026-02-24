import { useEffect } from "react";

export default function OAuthSuccess() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken) {
      sessionStorage.setItem("ga4_access_token", accessToken);
    }

    if (refreshToken) {
      sessionStorage.setItem("ga4_refresh_token", refreshToken);
    }

    // Redirect back to main app
    window.location.href = "/";
  }, []);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Connecting Google Account...</h2>
      <p>Please wait, finalizing authentication.</p>
    </div>
  );
}
