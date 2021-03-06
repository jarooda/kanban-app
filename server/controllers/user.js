const { User } = require('../models')
const { comparePassword } = require('../helpers/bcryptjs')
const { generateToken } = require('../helpers/jwt')
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);

class UserController {
    static async register(req, res, next) {
        const payload = {
            email: req.body.email,
            password: req.body.password
        }

        try {
            const user = await User.create(payload)
            res.status(200).json({id: user.id, email: user.email})
        } catch (error) {
            next(error)
        }
    }
    
    static async login(req, res, next) {
        const payload = {
            email: req.body.email || '',
            password: req.body.password || ''
        }

        try {
            const user = await User.findOne({
                where: {
                    email:payload.email
                }
            })

            if (!user) {
                throw {
                    status: 400,
                    message: `Wrong Email / Password`
                }
            } else if (comparePassword(payload.password, user.password)) {
                const access_token = generateToken({id:user.id, email:user.email})
                res.status(200).json({access_token, email: payload.email})
            } else {
                throw {
                    status: 400,
                    message: `Wrong Email / Password`
                }
            }
        } catch (error) {
            next(error)
        }
    }

    static async googleLogin(req, res, next) {
        try {
            const ticket = await client.verifyIdToken({
                idToken: req.body.google_token,
                audience: process.env.CLIENT_ID
            });

            const payload = ticket.getPayload()
            const userlogin = await User.findOne({
                where: {
                    email: payload.email
                }
            })

            if (userlogin) {
                const access_token = generateToken({id:userlogin.id, email:userlogin.email})
                res.status(200).json({access_token, email: payload.email})
            } else {
                const createuser = await User.create({
                    email: payload.email,
                    password: process.env.GOOGLE_PASSWORD
                })
                const access_token = generateToken({id:createuser.id, email:createuser.email})
                res.status(200).json({access_token, email: payload.email})
            }
        } catch (error) {
            next(error)
        }
    }
}

module.exports = UserController