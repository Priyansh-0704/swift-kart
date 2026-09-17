import { useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const GOOGLE_CLIENT_ID =import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const googleButtonRef = useRef(null);
  const googleInitialized = useRef(false);

  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState(null);

  const handleGoogleLogin = async (response) => {
    try {
      setMessage("Signing in with Google...");

      const result = await fetch(
        `${API_URL}/google`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            idToken: response.credential
          })
        }
      );

      const data = await result.json();

      if (!result.ok) {
        setMessage(data.message || "Google login failed.");
        return;
      }

      localStorage.setItem("token",data.token);

      setMessage("Google login successful.");

      setProfile(data.user);
    } catch (error) {
      setMessage(
        "Could not connect to the backend."
      );
    }
  };

  useEffect(() => {
    if (googleInitialized.current) {
      return;
    }

    const script = document.createElement("script");

    script.src ="https://accounts.google.com/gsi/client";

    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (!window.google || !googleButtonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin
      });

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: "outline",
          size: "large",
          text: "continue_with",
          width: 280
        }
      );

      googleInitialized.current = true;
    };

    document.body.appendChild(script);

    return () =>script.remove();
   
  }, []);

  const getProfile = async () => {
    const token =localStorage.getItem("token");

    if (!token) {
      setMessage("You are not logged in.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not get profile.");
        return;
      }

      setProfile(data.user);
      setMessage("Profile loaded successfully.");
    } catch (error) {
      setMessage(
        "Could not connect to the backend."
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("token");

    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }

    setProfile(null);
    setMessage("Logged out.");
  };

  return (
    <div className="app">
      <h1>SwiftKart Authentication</h1>

      <p>
        Small frontend only for testing
        authentication.
      </p>

      <div ref={googleButtonRef} style={{marginTop: "20px"}}/>

      <div style={{marginTop: "20px"}}>
        <button onClick={getProfile}>
          Get Profile
        </button>

        <button onClick={logout} style={{ marginLeft: "10px"}}>
          Logout
        </button>
      </div>

      {message && (
        <p>{message}</p>
      )}

      {profile && (
        <div>
          <h2>User</h2>

          <p>
            Name: {profile.name}
            <br />
            Email: {profile.email}
            <br />
            Username: {profile.username}
            <br />
            Role: {profile.role}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;