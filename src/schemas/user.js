const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const gravatar = require("gravatar");

const bcrypt = require("bcryptjs");
//количество проходов шифрования паролей, ставить до 10
const SALT_FACTOR = 6;

const { Subscription } = require("../helpers/constants");

const userSchema = new Schema(
  {
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      validate: {
        validator: function (value) {
          const re = /\S+@\S+\.\S+/;
          return re.test(String(value).toLowerCase());
        },
        message: (props) => `${props.value} is not a valid email!`,
        code: 501,
      },
    },
    subscription: {
      type: String,
      enum: {
        values: [Subscription.STARTER, Subscription.PRO, Subscription.BUSINESS],
        message: "This subscription isn't allowed",
      },
      default: Subscription.STARTER,
    },
    token: {
      type: String,
      default: null,
    },
    avatarURL: {
      type: String,
      default: function () {
        return gravatar.url(this.email, { s: "250" }, true);
      },
    },
    idCloudAvatar: {
      type: String,
      default: null,
    },
    verify: {
      type: Boolean,
      default: false,
    },
    verifyToken: {
      type: String,
      required: [true, "Verify token is required"],
    },
  },
  { versionKey: false, timestamps: true }
);

//перед сохранением в базу пароль кодируем
//function чтобы не потерять контекст this
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(
    this.password,
    bcrypt.genSaltSync(SALT_FACTOR)
  );
  next();
});

// валидаци не в схеме
// userSchema.path('email').validate( function (value) {
//     const re = /\S+@\S+\.\S+/;
//     return re.test(String(value).toLowerCase());
// })

userSchema.methods.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("user", userSchema);
module.exports = User;
