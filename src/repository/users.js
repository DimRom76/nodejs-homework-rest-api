const User = require("../schemas/user");

class UsersRepository {
  constructor() {
    this.model = User;
  }

  async findByField(field) {
    const result = await this.model.findOne(field);
    return result;
  }

  async create(body) {
    const user = new this.model(body);
    //так сделали чтобы сработал хук на pre save
    return user.save();
  }

  async updateFields(id, body) {
    const result = await this.model.findByIdAndUpdate({ _id: id }, { ...body });
    return result;
  }
}

module.exports = UsersRepository;
