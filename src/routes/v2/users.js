import { Router } from 'express'
import { authMiddleware, validatePassword, getRoleEnforcer, ErrorResponse } from '../../utils/v2'
import validator from 'validator'

const router = new Router()

router.get('/', authMiddleware, async (req, res) => {
  let response
  try {
    const users = await req.context.models.User.findAll({
      attributes: ['email', 'displayName']
    })

    return res.status(200).json(users)
  } catch (e) {
    console.error(e)
    response = new ErrorResponse(500)
  }

  return res.status(response.getCode()).json(response.getBody())
})

router.post('/', authMiddleware, async (req, res) => {
  let response = new ErrorResponse()
  try {
    if (validator.isEmail(req.body.email)) {
      if (validatePassword(req.body.password)) {
        const user = await req.context.models.User.create(req.body)

        if (req.body.roles !== undefined) {
          const enforcer = await getRoleEnforcer()
          for (const role of req.body.roles) {
            await enforcer.addRoleForUser(req.body.email.toLowerCase(), role)
          }
        }
        return res.status(200).json(user)

      } else {
        response = new ErrorResponse(400)
        response.addDetail('password', `'${req.body.password}' does not meet complexity requirements`)      }
    } else {
      response = new ErrorResponse(400)
      response.addDetail('email', `'${req.body.email}' is not a valid email address`)
    }
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error(error)
      response = new ErrorResponse(409)
      response.setMessage(`The user ${req.body.email} already exists`)
    } else {
      console.error(error)
      response = new ErrorResponse(500)
    }
  }

  return res.status(response.getCode()).json(response.getBody())
})

export default router