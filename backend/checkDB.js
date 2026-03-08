require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const uri = "mongodb+srv://anujrana167:Opklnm%40167@cluster1.sh0rs2e.mongodb.net/?appName=Cluster1";

async function check() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to DB...");
    
    // Check for ANY users
    const users = await User.find({});
    console.log(`Found ${users.length} users.`);
    users.forEach(u => {
      console.log(`- Email: ${u.email}, Role: ${u.role}, ID: ${u._id}`);
    });

    if (users.length === 0) {
        console.log("WARNING: Database is empty!");
    }
  } catch(err) {
    console.error("Error:", err);
  } finally {
    process.exit();
  }
}

check();
