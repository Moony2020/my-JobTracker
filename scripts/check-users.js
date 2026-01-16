const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../server/models/User');

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await User.countDocuments();
        const users = await User.find({}, 'email');
        console.log(`Total users: ${count}`);
        console.log('User emails:', users.map(u => u.email));
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkUsers();
