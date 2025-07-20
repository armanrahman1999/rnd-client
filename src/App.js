import "./App.css";
import { useEffect, useState } from "react";
import { Octokit } from "@octokit/core";
//testing
const CLIENT_ID = "Ov23ligSpt2ezibhkkfD";
//new test
//test 2
//test 3
//test 4
//test final
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("accessToken")
  );
  const [userData, setUserData] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [userRepos, setUserRepos] = useState([]);

  useEffect(() => {
    // Handle OAuth redirect with code parameter
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const code = urlParams.get("code");

    if (code && !isLoggedIn) {
      getAccessToken(code);
    }
  }, [isLoggedIn]);
  console.log("working");

  async function getAccessToken(code) {
    try {
      const response = await fetch(
        `https://rnd-deployment.onrender.com/getAccessToken?code=${code}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.access_token) {
        localStorage.setItem("accessToken", data.access_token);
        setIsLoggedIn(true);

        // Clear the code parameter from URL after login
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  }

  function loginWithGithub() {
    window.location.assign(
      `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}`
    );
  }

  async function getUserData() {
    try {
      const response = await fetch(
        "https://rnd-deployment.onrender.com/getUserData",
        {
          method: "GET",
          headers: {
            Authorization: `token ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);

      // If we get an authorization error, log the user out
      if (error.status === 401) {
        handleLogout();
      }
    }
  }

  async function getUserRepos() {
    try {
      const response = await fetch(
        "https://rnd-deployment.onrender.com/getUserRepos",
        {
          method: "GET",
          headers: {
            Authorization: `token ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) {
        // If we get an authorization error, log the user out
        if (response.status === 401) {
          handleLogout();
          return [];
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const repos = await response.json();
      setUserRepos(repos); // Assuming you have a state variable for repos
      console.log(repos);
      return repos;
    } catch (error) {
      console.error("Error fetching user repositories:", error);
      return [];
    }
  }

  function handleLogout() {
    fetch("https://rnd-deployment.onrender.com/logout", {
      method: "POST",
      headers: {
        Authorization: `token ${localStorage.getItem("accessToken")}`,
        "Content-Type": "application/json",
      },
    })
      .then(() => {
        localStorage.removeItem("accessToken");
        setIsLoggedIn(false);
        setUserData(null);
      })
      .catch((error) => {
        console.error("Logout error:", error);
        // Still remove the token and update state on error
        localStorage.removeItem("accessToken");
        setIsLoggedIn(false);
        setUserData(null);
      });
  }

  async function getUserRepositories() {
    try {
      const octokit = new Octokit({
        auth: localStorage.getItem("accessToken"),
      });

      const response = await octokit.request("GET /user/repos", {
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      setRepositories(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching repositories:", error);

      // Handle 401 unauthorized errors
      if (error.status === 401) {
        handleLogout();
      }
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        {isLoggedIn ? (
          <>
            <h1>You are logged in</h1>
            {userData && (
              <div className="user-info">
                <img
                  src={userData.avatar_url}
                  alt="Profile"
                  width="100"
                  className="avatar"
                />
                <h2>{userData.name || userData.login}</h2>
              </div>
            )}
            <div className="button-group">
              <button onClick={getUserData}>Get User Data</button>
              <button onClick={handleLogout}>Log Out</button>
              <button onClick={getUserRepos}>Get User Repos</button>
            </div>
          </>
        ) : (
          <>
            <h1>GitHub Login Demo</h1>
            <button onClick={loginWithGithub}>Login with Github</button>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
