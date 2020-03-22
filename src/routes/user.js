import {Router} from 'express';
import validator from 'validator';
import utils from '../utils';

const router = new Router();

// User login.
router.post('/login', async (req, res) => {
	try {
		const {email, password} = req.body;
		if (validator.isEmail(email)) {
			const token = await req.context.models.User.findByLogin(email, password);
			if (token) {
				console.log(token);
				return res.send(token);
			}
		}

		throw new Error('Invalid input');
	} catch {
		res.status(400).send('Invalid input');
	}
});

// Gets all users.
router.get('/', async (req, res) => {
	try {
		if (await utils.validateToken(req, res)) {
			const users = await req.context.models.User.findAll({
				attributes: ['id', 'email', 'roles', 'displayName', 'phone', 'createdAt', 'updatedAt']
			});

			for (const user of users) {
				user.roles = await req.context.models.UserRole.findRoles(user.roles);
			}

			return res.send({
				_meta: {
					total: users.length
				},
				results: users
			});
		}

		throw new Error('Invalid input');
	} catch {
		res.status(400).send('Invalid input');
	}
});

// Gets a specific user.
router.get('/:email', async (req, res) => {
	try {
		if (validator.isEmail(req.params.email) && await utils.validateToken(req, res)) {
			const user = await req.context.models.User.findOne({
				where: {
					email: req.params.email
				},
				attributes: ['id', 'email', 'roles', 'displayName', 'phone', 'createdAt', 'updatedAt']
			});
			if (user) {
				user.roles = await req.context.models.UserRole.findRoles(user.roles);
				/** @todo add contact info for users */
				// user.dataValues.contact = await req.context.models.Contact.findByUserId(user.id);
			}

			return res.send(user);
		}

		throw new Error('Invalid input');
	} catch (e) {
		console.error(e);
		res.status(400).send('Invalid payload');
	}
});

// Creates a new user.
router.post('/', async (req, res) => {
	try {
		if (validator.isEmail(req.body.email)) {
			const {email, password, roles} = req.body;
			const user = await req.context.models.User.create({email, password, roles});
			return res.send(user.email + ' created');
		}

		throw new Error('Invalid input');
	} catch {
		return res.status(400).send('Invalid input');
	}
});

// Updates any user.
router.put('/', async (req, res) => {
	try {
		if (validator.isEmail(req.body.email) && await utils.validateToken(req, res)) {
			/** @todo add email and phone update options */
			const {email, password} = req.body;
			const user = await req.context.models.User.findOne({
				where: {
					email
				}
			});
			user.password = password;
			await user.save();
			return res.send(user.email + ' updated');
		}

		throw new Error('Invalid input');
	} catch {
		res.status(400).send('Invalid input');
	}
});

// Deletes a user.
router.delete('/:email', async (req, res) => {
	try {
		if (validator.isEmail(req.params.email) && await utils.validateToken(req, res)) {
			const user = await req.context.models.User.findOne({
				where: {
					email: req.params.email
				}
			});
			await user.destroy();
			return res.send(req.params.email + ' deleted');
		}

		throw new Error('Invalid input');
	} catch {
		res.status(400).send('Invalid input');
	}
});

export default router;
