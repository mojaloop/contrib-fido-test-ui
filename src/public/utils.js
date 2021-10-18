class Utils {
  static arrayBufferToBase64String(ab) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(ab)));
  }

  static stringToArrayBuffer(input) {
    // base64 to Buffer
    const binaryStr = atob(input)
    const bufUint8Array = Uint8Array.from(binaryStr, c => c.charCodeAt(0))
    const ab = bufUint8Array.buffer

    return ab
  }

  static async deriveChallengeFromConsent(input) {
    const rawChallenge = {
      consentId: input.consentId,
      scopes: input.scopes
    }

    // lazy json canonicalize - the only thing to worry about is the order of scopes objects

    /*
      https://datatracker.ietf.org/doc/html/rfc8785#section-3.2.3

      *  JSON object properties MUST be sorted recursively, which means
         that JSON child Objects MUST have their properties sorted as well.

      *  JSON array data MUST also be scanned for the presence of JSON
         objects (if an object is found, then its properties MUST be
         sorted), but array element order MUST NOT be changed.
    */
    rawChallenge.scopes = rawChallenge.scopes.map(s => ({
      accountId: s.accountId,
      actions: s.actions
    }))
    const challengeString = JSON.stringify(rawChallenge)
    const encoder = new TextEncoder();
    const data = encoder.encode(challengeString);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const base64Hash = btoa(hash)

    return base64Hash
  }
}