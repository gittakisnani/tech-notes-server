const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

//@desc Login
//@route POST /auth
//@access Public

const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if(!username || !password) return res.status(400).json({ message: 'Missing username or password'});

    const user = await User.findOne({ username }).lean().exec();

    if(!user) return res.status(401).json({ message: 'Unauthorized' });
    if(!user.active) return res.status(401).json({ message: 'User not active'})

    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(401).json({ message: 'Password incorrect' });
    const accessToken = jwt.sign(
        {
            "Userinfo": {
                "username": user.username,
                "roles": user.roles
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15s'}
    )

    const refreshToken = jwt.sign(
        { "username": user.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '20s' }
    )

    res.cookie('jwt', refreshToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 7 * 24* 60 * 60 * 1000});

    res.json({ accessToken })
})

//@desc Refresh
//@route get /auth/refresh
//@access Private - AccessToken expired
const refresh = (req, res) => {
    const cookies = req.cookies;
    console.log(cookies)

    if(!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized'});


    const refreshToken = cookies.jwt;


    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        asyncHandler(async (err, decoded) => {
            if(err) {
                console.log(err);
                return res.status(403).json({ message: 'Forbidden' });
            }

            const user = await User.findOne({ username: decoded.username  }).lean().exec();
            if(!user) return res.status(401).json({ message: 'Unauthorized' })

            const accessToken = jwt.sign(
                {
                    Userinfo: {
                        username: user.username,
                        roles: user.roles
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15s'}
            )

            res.json({ accessToken })
        })
    )
}

//@desc Logout
//@route POST /auth/logout
//@access Public

const logout = (req, res) => {
    const cookies = req?.cookies;
    if(!cookies) return res.sendStatus(204);
    res.clearCookie('jwt', { secure: true, sameSite: 'None', httpOnly: true });
    res.json({ message: 'Cookie cleared'})
}

module.exports = {
    login,
    refresh,
    logout
}