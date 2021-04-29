const jwt = require("jsonwebtoken");
const { UsersRepository } = require("../repository");

require("dotenv").config();
const SECRET_KEY = process.env.JWT_SECRET_KEY;

class AuthService {
  constructor() {
    this.repositories = { users: new UsersRepository() };
  }

  async login({ email, password }) {
    const user = await this.repositories.users.create.findByField({ email });
    if (!user || !user.validPassword(password) || !user.verify) return null;

    const id = user.id;
    const payload = { id };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
    await this.repositories.users.updateFields(id, { token });

    return token;
  }

  async logout(id) {
    const data = await this.repositories.users.updateFields(id, {
      token: null,
    });
    return data;
  }
}

module.exports = AuthService;
