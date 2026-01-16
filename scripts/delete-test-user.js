const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../server/models/User');

const deleteTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const result = await User.deleteOne({ email: 'test@test.com' });
        
        if (result.deletedCount > 0) {
            console.log('Successfully deleted test@test.com');
        } else {
            console.log('User test@test.com not found');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error deleting user:', error);
        process.exit(1);
    }
};

deleteTestUser();
