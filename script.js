
// ========================================
// CONFIG
// ========================================

const SUPABASE_URL =
  "https://pzsqaekyyovffvidpyjd.supabase.co";

const AUTH_FUNCTION_URL =
  `${SUPABASE_URL}/functions/v1/telegram-auth`;

const ACCESS_TOKEN_KEY =
  "axiom_access_token";

const REFRESH_TOKEN_KEY =
  "axiom_refresh_token";

const USER_KEY =
  "axiom_user";


// ========================================
// TELEGRAM AUTH
// ========================================

async function onTelegramAuth(telegramUser) {
  console.log(
    "Telegram user:",
    telegramUser
  );

  try {

    // ====================================
    // SEND TELEGRAM DATA TO SUPABASE
    // ====================================

    const response =
      await fetch(
        AUTH_FUNCTION_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(
              telegramUser
            )
        }
      );


    // ====================================
    // READ RESPONSE
    // ====================================

    const text =
      await response.text();

    console.log(
      "HTTP status:",
      response.status
    );

    console.log(
      "Server response:",
      text
    );


    let data;

    try {
      data =
        JSON.parse(text);
    } catch {
      throw new Error(
        "Сервер вернул некорректный ответ"
      );
    }


    // ====================================
    // SERVER ERROR
    // ====================================

    if (!response.ok) {

      throw new Error(
        data.error ||
        "Ошибка авторизации"
      );
    }


    // ====================================
    // CHECK SUCCESS
    // ====================================

    if (!data.success) {

      throw new Error(
        data.error ||
        "Авторизация не выполнена"
      );
    }


    // ====================================
    // CHECK SESSION
    // ====================================

    if (
      !data.session ||
      !data.session.access_token
    ) {

      throw new Error(
        "Supabase не вернул сессию"
      );
    }


    // ====================================
    // SAVE SESSION
    // ====================================

    saveSession(
      data.session
    );


    // ====================================
    // SAVE USER
    // ====================================

    if (data.user) {

      saveUser(
        data.user
      );

      showUser(
        data.user
      );
    }


    console.log(
      "✅ Authorization successful"
    );

    console.log(
      "Supabase session:",
      data.session
    );


  } catch (error) {

    console.error(
      "❌ Auth error:",
      error
    );


    alert(
      "Ошибка авторизации\n\n" +
      error.message
    );
  }
}


// ========================================
// SAVE SESSION
// ========================================

function saveSession(session) {

  if (
    !session ||
    !session.access_token
  ) {
    return;
  }


  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    session.access_token
  );


  if (
    session.refresh_token
  ) {

    localStorage.setItem(
      REFRESH_TOKEN_KEY,
      session.refresh_token
    );
  }


  localStorage.setItem(
    "axiom_session_expires_at",
    String(
      session.expires_at || ""
    )
  );
}


// ========================================
// GET ACCESS TOKEN
// ========================================

function getAccessToken() {

  return localStorage.getItem(
    ACCESS_TOKEN_KEY
  );
}


// ========================================
// GET REFRESH TOKEN
// ========================================

function getRefreshToken() {

  return localStorage.getItem(
    REFRESH_TOKEN_KEY
  );
}


// ========================================
// SAVE USER
// ========================================

function saveUser(user) {

  const safeUser = {

    telegram_id:
      user.telegram_id ??
      user.id ??
      null,

    username:
      user.username ??
      null,

    first_name:
      user.first_name ??
      "",

    last_name:
      user.last_name ??
      "",

    photo_url:
      user.photo_url ??
      null
  };


  localStorage.setItem(
    USER_KEY,
    JSON.stringify(
      safeUser
    )
  );


  return safeUser;
}


// ========================================
// GET SAVED USER
// ========================================

function getUser() {

  const savedUser =
    localStorage.getItem(
      USER_KEY
    );


  if (!savedUser) {
    return null;
  }


  try {

    return JSON.parse(
      savedUser
    );

  } catch (error) {

    console.error(
      "Ошибка чтения пользователя:",
      error
    );


    localStorage.removeItem(
      USER_KEY
    );


    return null;
  }
}


// ========================================
// CLEAR SESSION
// ========================================

function clearSession() {

  localStorage.removeItem(
    ACCESS_TOKEN_KEY
  );

  localStorage.removeItem(
    REFRESH_TOKEN_KEY
  );

  localStorage.removeItem(
    "axiom_session_expires_at"
  );

  localStorage.removeItem(
    USER_KEY
  );
}


// ========================================
// LOGOUT
// ========================================

async function logout() {

  const accessToken =
    getAccessToken();


  try {

    if (accessToken) {

      await fetch(
        `${SUPABASE_URL}/auth/v1/logout`,
        {
          method: "POST",

          headers: {
            "Authorization":
              `Bearer ${accessToken}`,

            "apikey":
              getSupabaseAnonKey()
          }
        }
      );
    }

  } catch (error) {

    console.warn(
      "Logout request error:",
      error
    );

  } finally {

    clearSession();

    window.location.reload();
  }
}


// ========================================
// SUPABASE ANON KEY
// ========================================
//
// ВАЖНО:
// Здесь нужен твой PUBLIC / ANON key.
//
// НЕ вставляй сюда:
// - service_role key
// - secret key
// - TELEGRAM_BOT_TOKEN
//
// Если logout пока не работает,
// это место нужно заполнить.
// ========================================

function getSupabaseAnonKey() {

  return "";
}


// ========================================
// SHOW USER
// ========================================

function showUser(user) {

  const telegramLogin =
    document.getElementById(
      "telegram-login"
    );


  if (!telegramLogin) {
    return;
  }


  const firstName =
    user.first_name ||
    "Пользователь";


  const username =
    user.username
      ? `@${user.username}`
      : "Telegram пользователь";


  const avatar =
    user.photo_url
      ? `
        <img
          class="user-profile__avatar"
          src="${escapeHtml(
            user.photo_url
          )}"
          alt="${escapeHtml(
            firstName
          )}"
        >
      `
      : `
        <div
          class="
            user-profile__avatar
            user-profile__avatar--empty
          "
        >
          ${escapeHtml(
            firstName
              .charAt(0)
              .toUpperCase()
          )}
        </div>
      `;


  telegramLogin.innerHTML = `

    <div class="user-profile">

      <div class="user-profile__info">

        ${avatar}

        <div class="user-profile__text">

          <span
            class="user-profile__name"
          >
            ${escapeHtml(
              firstName
            )}
          </span>

          <span
            class="user-profile__username"
          >
            ${escapeHtml(
              username
            )}
          </span>

        </div>

      </div>


      <button
        class="user-profile__logout"
        type="button"
        id="logout-button"
      >
        Выйти
      </button>

    </div>
  `;


  const logoutButton =
    document.getElementById(
      "logout-button"
    );


  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      logout
    );
  }
}


// ========================================
// HIDE TELEGRAM LOGIN
// ========================================

function hideTelegramLogin() {

  const telegramLogin =
    document.getElementById(
      "telegram-login"
    );


  if (!telegramLogin) {
    return;
  }


  telegramLogin.innerHTML = "";
}


// ========================================
// CHECK TOKEN
// ========================================

async function checkToken() {

  const accessToken =
    getAccessToken();


  if (!accessToken) {

    console.log(
      "No Supabase access token"
    );

    return false;
  }


  try {

    const response =
      await fetch(
        `${SUPABASE_URL}/auth/v1/user`,
        {
          method: "GET",

          headers: {

            "Authorization":
              `Bearer ${accessToken}`,

            "apikey":
              getSupabaseAnonKey()
          }
        }
      );


    if (!response.ok) {

      console.log(
        "Access token invalid"
      );

      return false;
    }


    const authUser =
      await response.json();


    console.log(
      "✅ Supabase user:",
      authUser
    );


    return true;

  } catch (error) {

    console.error(
      "Token check error:",
      error
    );


    return false;
  }
}


// ========================================
// GET CURRENT USER
// ========================================

async function getCurrentUser() {

  const accessToken =
    getAccessToken();


  if (!accessToken) {
    return null;
  }


  try {

    const response =
      await fetch(
        `${SUPABASE_URL}/auth/v1/user`,
        {
          method: "GET",

          headers: {

            "Authorization":
              `Bearer ${accessToken}`,

            "apikey":
              getSupabaseAnonKey()
          }
        }
      );


    if (!response.ok) {

      return null;
    }


    return await response.json();

  } catch {

    return null;
  }
}


// ========================================
// RESTORE AUTH
// ========================================

async function restoreAuth() {

  const user =
    getUser();


  if (!user) {

    console.log(
      "User is not logged in"
    );

    return;
  }


  console.log(
    "Restoring user:",
    user
  );


  const valid =
    await checkToken();


  if (valid) {

    showUser(
      user
    );

    console.log(
      "✅ Session restored"
    );

    return;
  }


  // ====================================
  // TOKEN INVALID
  // ====================================

  console.log(
    "Access token expired or invalid"
  );


  clearSession();
}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHtml(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }


  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


// ========================================
// PAGE LOAD
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "========== ITHelper AUTH =========="
    );


    await restoreAuth();

  }
);
