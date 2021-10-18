
const usersCollection = db.collection('users')

class UserNotFoundError extends Error {
  constructor(phoneNumber) {
    super(`users/${phoneNumber} not found`)
    this.name ='UserNotFoundError'
  }
}


class Model {
  async getOrCreateUserForPhoneNumber(phoneNumber, userData) {
    try {
      return await this.getUserForPhoneNumber(phoneNumber)
    } catch (err) {
      // User simply not found, create them
      if (err.name === 'UserNotFoundError') {
        await this.createUserForPhoneNumber(phoneNumber, userData)
        return userData;
      }
    }
  }

  async getUserForPhoneNumber(phoneNumber) {
    return usersCollection.doc(phoneNumber).get().then(doc => {
      if (!doc.exists) {
        throw new UserNotFoundError(phoneNumber)
      }

      // TODO: some validation?
      return doc.data()
    })
  }

  async createUserForPhoneNumber(phoneNumber, userData) {
    return usersCollection
      .doc(phoneNumber)
      .set(userData)
  }

  async updateAccountNickname(phoneNumber, newAccountNickname) {
    return usersCollection
      .doc(phoneNumber)
      .update({
        accountNickname: newAccountNickname
      })
  }

}




