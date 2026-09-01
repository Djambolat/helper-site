const AUTH_KEY = "axiom_user";


// ==============================
// TELEGRAM AUTH
// ==============================

function onTelegramAuth(user) {
  console.log("Telegram user:", user);

  fetch(
    "https://pzsqaekyyovffvidpyjd.supabase.co/functions/v1/telegram-auth",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(user)
    }
  )
    .then(async (response) => {
      const text = await response.text();

      console.log("HTTP status:", response.status);
      console.log("Server response:", text);

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Сервер вернул не JSON");
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Ошибка сервера"
        );
      }

      return data;
    })

    .then((data) => {
      console.log("Supabase response:", data);

      if (!data.success) {
        alert(
          "Ошибка авторизации\n\n" +
          JSON.stringify(data, null, 2)
        );

        return;
      }

      const userData = saveUser({
        id: data.user.telegram_id,
        username: data.user.username,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        photo_url: data.user.photo_url
      });

      showUser(userData);

      console.log("User saved:", userData);
    })

    .catch((error) => {
      console.error("Auth error:", error);

      alert(
        "Ошибка соединения с сервером\n\n" +
        error.message
      );
    });
}


// ==============================
// SAVE USER
// ==============================

function saveUser(user) {
  const safeUser = {
    telegram_id: user.id,
    username: user.username || null,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    photo_url: user.photo_url || null
  };

  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify(safeUser)
  );

  return safeUser;
}


// ==============================
// GET USER
// ==============================

function getUser() {
  const savedUser =
    localStorage.getItem(AUTH_KEY);

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    console.error(
      "Ошибка чтения пользователя:",
      error
    );

    localStorage.removeItem(AUTH_KEY);

    return null;
  }
}


// ==============================
// LOGOUT
// ==============================

function logout() {
  localStorage.removeItem(AUTH_KEY);

  window.location.reload();
}


// ==============================
// SHOW USER
// ==============================

function showUser(user) {
  const telegramLogin =
    document.getElementById("telegram-login");

  if (!telegramLogin) {
    return;
  }

  telegramLogin.innerHTML = `
    <div class="user-profile">

      ${
        user.photo_url
          ? `
            <img
              class="user-profile__avatar"
              src="${user.photo_url}"
              alt=""
            >
          `
          : ""
      }

      <span class="user-profile__name">
        ${user.first_name}
      </span>

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


// ==============================
// CHECK AUTH
// ==============================

function checkAuth() {
  const user = getUser();

  if (user) {
    showUser(user);
  }
}


// ==============================
// PAGE LOAD
// ==============================

document.addEventListener(
  "DOMContentLoaded",
  () => {
    checkAuth();
  }
);