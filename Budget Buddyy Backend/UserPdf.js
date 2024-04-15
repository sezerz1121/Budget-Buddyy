import mongoose from "mongoose";

const newSchema = new mongoose.Schema({
    
          "ref_id":{
            type:mongoose.Schema.Types.ObjectId,
            ref:"user"
            },
            "time":String,
            "link":String
         
       
});

const UserPdf = mongoose.model("PDF", newSchema);

export default UserPdf;
