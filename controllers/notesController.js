const Note = require('../models/Note');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find().lean();

    if(!notes?.length) {
        res.status(400).json({ message: 'Notes not found'})
    }

    res.status(200).json(notes)
})

const createNewNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req?.body;

    if(!user || !title || !text) return res.status(400).json({ message: 'All fields are required'});

    //Checking for user
    const userValid = await User.findById(user).lean().exec();
    if(!userValid) return res.status(400).json({ message: 'Cannot find user.'})

    //Checking for duplicates
    const duplicate = await Note.findOne({ title }).lean().exec();
    if(duplicate) return res.status(400).json({ message: 'Duplicated note'});

    const noteObj = { title, text, user }

    const note = await Note.create(noteObj);

    if(note) {
        res.status(201).json({ message: `Note ${note.title} created`})
    } else {
        res.status(400).json({ message: 'Cannot create note.Try again'})
    }
})

const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed } = req?.body;

    if(!id || !user || !title || !text || typeof completed !== "boolean") return res.status(400).json({ message: 'All fields are required'})

    //Check note
    const note = await Note.findOne({ user }).exec();

    if(!note) return res.status(404).json({ message: 'Note not found.'});

    //Checking for duplicated title 
    const duplicate = await Note.findOne({ title }).lean().exec();

    if(duplicate && duplicate._id.toString() !== id) {
        return res.status(400).json({ message: 'Duplicated note.'})
    }

    note.title = title;
    note.completed = completed
    note.text = text

    const updatedNote = await note.save();

    if(updatedNote) {
        res.status(201).json({ message: `Note Updated`})
    } else 
    res.status(400).json({ message: 'Cannot update note'})
})

const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req?.body;

    if(!id) return res.status(400).json({ message: 'ID Required'})

    //Checking for note

    const note = await Note.findById(id).exec();

    if(!note) return res.status(404).json({ message: 'Note not found'});

    const deletedNote = await note.deleteOne();

    res.status(204).json({ message: `Note ${deletedNote.title} with ID ${deletedNote._id || id} deleted`})
})

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}