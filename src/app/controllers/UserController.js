import * as Yup from 'yup';
import User from '../models/User';
import File from '../models/File';

class UserController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Body validation fails!' });
    }

    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists) {
      res.status(400).json({ error: 'E-mail already registered!' });
    }

    const { id, name, email, provider } = await User.create(req.body);
    return res.json({
      id,
      name,
      email,
      provider,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      avatar_id: Yup.number(),
      oldpassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldpassword', (oldpassword, field) =>
          oldpassword ? field.required() : field
        ),
      confirmPassword: Yup.string()
        .min(6)
        .when('password', (password, field) =>
          password ? field.required().oneOf([Yup.ref('password')]) : field
        ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Body validation fails!' });
    }

    const { email, oldpassword } = req.body;
    const { userId } = req;

    const user = await User.findByPk(userId);

    if (email && email !== user.email) {
      const userExists = await User.findOne({ where: { email } });

      if (userExists) {
        res.status(400).json({ error: 'E-mail already registered!' });
      }
    }

    if (oldpassword && !(await user.checkPassword(oldpassword))) {
      return res.status(401).json({ error: 'Password does not match!' });
    }

    await user.update(req.body);

    const { id, name, avatar, provider } = await User.findByPk(req.userId, {
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return res.json({
      id,
      name,
      email,
      avatar,
      provider,
    });
  }
}

export default new UserController();
