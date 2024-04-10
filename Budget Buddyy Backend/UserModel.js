import mongoose from "mongoose";

const newSchema = new mongoose.Schema({
    
         
          "name": String,
          "email": String,
          "picture":String,
         
       
});

const UserModel = mongoose.model("user", newSchema);

export default UserModel;