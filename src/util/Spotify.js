const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI;
let accessToken;

const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    }
    //check for acces token match
    let accessTokenMatch = window.location.hash.match(/access_token=([^&]*)/);
    let expiresInMatch = window.location.hash.match(/expires_in=([^&]*)/);

    console.log(accessTokenMatch);
    console.log(expiresInMatch);

    if (accessTokenMatch && expiresInMatch) {
      accessToken = accessTokenMatch[1];
      console.log(accessToken);
      let expiresIn = Number(expiresInMatch[1]);

      //Clears the paramethers, allowing us to grab a new access token when it expires
      window.setTimeout(() => (accessToken = ""), expiresIn * 1000);
      window.history.pushState("Access Token", null, "/");
      return accessToken;
    } else {
      const accessUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&scope=playlist-modify-public&redirect_uri=${REDIRECT_URI}`;

      window.location = accessUrl;
      console.log(accessUrl);
    }
  },

  search(searchTerm) {
    accessToken = Spotify.getAccessToken();

    console.log("acces token from search " + accessToken);
    return fetch(
      `https://api.spotify.com/v1/search?type=track&q=${searchTerm}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
      .then((response) => {
        return response.json();
      })
      .then((jsonResponse) => {
        if (!jsonResponse.tracks) {
          return;
        }
        return jsonResponse.tracks.items.map((track) => ({
          id: track.id,
          name: track.name,
          album: track.album.name,
          uri: track.uri,
        }));
      });
  },

  savePlaylist(name, trackURI) {
    if (!name || !trackURI.length) {
      console.log("no name or tracks");
      return;
    }
    let accessTokenSave = accessToken;

    console.log("from save " + accessTokenSave);
    const headers = { Authorization: `Bearer ${accessTokenSave}` };
    let userID;

    return fetch(`https://api.spotify.com/v1/me`, { headers: headers })
      .then((response) => response.json())
      .then((jsonResponse) => {
        userID = jsonResponse.id;
        console.log(jsonResponse);

        return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
          headers: headers,
          method: "POST",
          body: JSON.stringify({ name: name }),
        })
          .then((response) => response.json())
          .then((jsonResponse) => {
            console.log(jsonResponse);
            const playlistId = jsonResponse.id;
            //updated spotify API endpoint
            return fetch(
              `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
              {
                headers: headers,
                method: "POST",
                body: JSON.stringify({ uris: trackURI }),
              }
            );
          });
      });
  },
};

export default Spotify;
