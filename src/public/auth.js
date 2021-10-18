class Auth {
  firebaseObserverAuth

  constructor(config) {
    if (!config || !config.callbacks || !config.callbacks.onUserSignedIn) {
      throw new Error('config.callbacks.onUserSignedIn is required')
    }
    if (!config || !config.callbacks || !config.callbacks.onUserSignedOut) {
      throw new Error('config.callbacks.onUserSignedOut is required')
    }

    this.firebaseObserverAuth = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        config.callbacks.onUserSignedIn(user)
        return;
      }

      config.callbacks.onUserSignedOut()
    });
  }

  async signOut() {
    return firebase.auth().signOut()
  }
}