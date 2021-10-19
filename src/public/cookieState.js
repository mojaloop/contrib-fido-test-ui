const key = 'lastcredential'

class CookieState {

  get() {
    let value = ''

    let name = key + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        value = c.substring(name.length, c.length);
      }
    }
    try {
      return JSON.parse(value)
    } catch (err) {
      return null
    }
  }

  set(value) {
    const d = new Date();
    d.setTime(d.getTime() + (2 * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();

    const valueStr = JSON.stringify(value)
    document.cookie = `${key}=${valueStr};${expires};path=/;SameSite=strict`
  }


  clear() {
    document.cookie = `${key}=;`
  }
}

