const cloudinary = require("cloudinary").v2;

const fs = require("fs/promises");
require("dotenv").config();
const { nanoid } = require("nanoid");

const { ErrorHandler } = require("../helpers/errorHandler");
const { UsersRepository } = require("../repository");
const EmailService = require("./email");

class UsersService {
  constructor() {
    this.cloudinary = cloudinary;
    this.cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.CLOUD_API_KEY,
      api_secret: process.env.CLOUD_API_SECRET,
    });

    this.emailService = new EmailService();
    this.repositories = { users: new UsersRepository() };
  }

  async create(body) {
    const verifyToken = nanoid();
    const { email } = body;

    try {
      await this.emailService.sendEmail(verifyToken, email);
    } catch (e) {
      throw new ErrorHandler(503, e.message, "Service Unavailable");
    }

    const data = await this.repositories.users.create({ ...body, verifyToken });
    return data;
  }

  async findByEmail(email) {
    const data = await this.repositories.users.findByField({ email });
    return data;
  }

  async findById(id) {
    const data = await this.repositories.users.findByField({ _id: id });
    return data;
  }

  async findByToken(token) {
    const { subscription, email } = await this.repositories.users.findByField({
      token,
    });
    return { subscription, email };
  }

  async update(id, body) {
    const { subscription, email } = await this.repositories.users.updateFields(
      id,
      body
    );
    return { subscription, email };
  }

  async verify({ verificationToken }) {
    const user = await this.repositories.users.findByField({
      verifyToken: verificationToken,
    });
    if (user) {
      //зафиксируем что пользователь прошел проверку по емаил
      await this.repositories.users.updateFields(user._id, {
        verify: true,
        verifyToken: null,
      });

      return true;
    }
    return false;
  }

  async updateAvatar(id, pathFile) {
    try {
      const objCloud = await this.#uploadCloud(pathFile);
      const { secure_url: avatarURL, public_id: idCloudAvatar } = objCloud;

      //получаем пользователя и чистим старую аватарку
      const oldUserAvatar = await this.repositories.users.findByField({
        _id: id,
      });

      if (oldUserAvatar.idCloudAvatar) {
        this.cloudinary.uploader.destroy(
          oldUserAvatar.idCloudAvatar,
          (err, result) => {
            console.log(err, result);
          }
        );
      }

      //записываем новую аватарку
      await this.repositories.users.updateFields(id, {
        avatarURL,
        idCloudAvatar,
      });

      //удаляем временный файл с диска
      await fs.unlink(pathFile);
      return avatarURL;
    } catch (error) {
      throw new ErrorHandler(null, "Error upload avatar to cloud");
    }
  }

  //делаем обертку так как cloudinary не создает промисы
  //folder: :'avatars  -  путь к папке на сервисе cloudinary
  //{ width: 250, crop: "fill" } - образаем при загрузке в облако
  #uploadCloud = (pathFile) => {
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader.upload(
        pathFile,
        { folder: "avatars", transformation: { width: 250, crop: "fill" } },
        function (error, result) {
          if (error) reject(error);
          if (result) resolve(result);
        }
      );
    });
  };
}

module.exports = UsersService;
