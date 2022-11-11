const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const User = require('../models/User')
const Note = require('../models/Note')

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean()
    if(!users.length) return res.status(400).send({ message: 'Users not found'})
    res.status(200).json(users)
})

const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body;


    //Checking for missing fields
    if(!username || !password || !Array.isArray(roles) || !roles?.length) return res.status(400).json({ message: 'All fields are required.'})

    //Checking for duplicate usernames
    const duplicate = await User.findOne({ username }).lean().exec();

    if(duplicate) return res.status(409).json({ message: 'Username already taken '})

    const hashedPwd = await bcrypt.hash(password, 10);

    const newUserObj = { username, "password": hashedPwd, roles }
    
    const user = await User.create(newUserObj)

    if(user) {
        res.status(201).json({ message: `User ${username} created`})
    } else {
        res.status(400).json( { message: 'Cannot create new user. Please try again.'})
    }
})

const updateUser = asyncHandler(async (req, res) => {
    const { id, username, password, roles, active } = req?.body;

    if(!id || !username || !roles?.length || !Array.isArray(roles) || typeof active !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required '})
    }

    //Checking for user
    const user = await User.findById(id).exec();

    if(!user) return res.status(404).json({ message: 'User not found'})

    //Checking for duplicate
    const duplicate = await User.findOne({ username }).lean().exec();
    if(duplicate && duplicate?._id.toString() !== id) return res.status(409).json({ message: 'Username already taken' })

    user.username = username;
    user.roles = roles;
    user.active = active;
    if(password) {
        user.password = await bcrypt.hash(password, 10)
    }

    const result = await user.save();

    if(result) {
        res.status(201).json({ message: `User ${username} updated`})
    } else {
        res.status(400).json({ message: 'Cannot update user' })
    }
})  

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req?.body;

    if(!id) return res.status(400).json({ message: 'ID required'})

    //Check user
    const user = await User.findById(id).exec();

    if(!user) return res.status(404).json({ message: 'User not found'})

    const note = await Note.findOne({ user: id })
    if(note) return res.status(400).json({ message: 'Cannot delete user with assigned notes'})


    const deletedUser = await user.deleteOne();

    if(deletedUser) {
        res.status(204).json({ message: `user with ID: ${deletedUser._id || id} & username: ${deletedUser?.username} deleted`})
    } else {
        res.status(400).json({ message: 'Cannot delete user'})
    }
})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}