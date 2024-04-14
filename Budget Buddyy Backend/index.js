import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from "./UserModel.js"; 
import authenticateToken from "./MiddleWare.js";
import UserBudget from "./UserBudget.js";
import PDFDocument from 'pdfkit';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
  
const __dirname = path.dirname(__filename);

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret
});



const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({
  origin: "https://budget-buddyy-client.vercel.app",
  credentials: true,
  methods: ['GET', 'POST'], // Allow GET and POST methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allow specific headers
}))
app.use('/pdf', express.static(path.join(__dirname, 'pdf')));


const secretKey = '123456789';
const port = 3000;
// Set up Multer storage for PDFs
const storage = multer.memoryStorage(); // Use memory storage for Multer to handle file uploads
const upload = multer({ storage: storage });

mongoose.connect("mongodb+srv://tatsam24copywriter:bWbQN7urqvswx2bU@drivewise.zgowklk.mongodb.net/?retryWrites=true&w=majority&appName=DriveWise", {
    serverSelectionTimeoutMS: 5000
});



app.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Fetch user profile information using the email extracted from the token
    const user = await UserModel.findOne({ email: req.email });

    // Check if user is not found
    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Return user profile information as JSON response
    return res.json(user);
  } catch (error) {
    // Handle errors
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
app.get('/home', authenticateToken, async (req, res) => {
    try {
      
      const user = await UserModel.findOne({ email: req.email });
  
      
      if (!user) {
        return res.status(404).send("User not found.");
      }
  
     
      return res.json(user);
    } catch (error) {
      
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get('/Budgetcards', authenticateToken, async (req, res) => {
    try {
      const userRefID = req._id;
      

      // Fetch user's cards based on their refID (_id in this case)
      const userCards = await UserBudget.find({ ref_id: userRefID });

      return res.json(userCards);
  } catch (error) {
      console.error("Error fetching user's cards:", error);
      return res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/register", async (req, res) => {
    const { name, email,picture } = req.body;
    
    try {
        const checkEmail = await UserModel.findOne({ email: email });

        if (checkEmail) {
            
            return res.json("Email already exists");
        }

       
        
     // Convert drivingLicenseDate to Date object
    
        const newUser = await UserModel.create({
            name,
            email,
            picture,
           

        });

        
        res.json("User created successfully");
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/newbudget", async (req, res) => {
  const {ref_id,price,emoji,item_name } = req.body;
  
  try {
      

      const datetime = new Date();
      
   
  
      const newBudget = await UserBudget.create({
          ref_id,
          price,
          emoji,
          item_name,
          datetime,
         

      });

      
      res.json("User created successfully");
  } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/SignIn", async (req, res) => {
    const { email, name } = req.body;
    
    try {
      
      const user = await UserModel.findOne({ email: email });
      
      if (!user) {
        
        return res.json("User not found");
      }
      
      
      
      
      if (email) {
        
        const token = jwt.sign({ _id:user._id,email:user.email }, secretKey,{expiresIn: "4h"});
              
              return res.json({ message: "exist", token: token });
             
        
      } else {

        return res.json("notExist");
      }
    } catch (error) {
      
      console.error("Error during/whilelogin:", error);
      return res.json({ error: "Internal server error" });
    }
  });



app.get('/generate-pdf', async (req, res) => {
    try {
      const userRefID = req.query._id;
  
      const userCards = await UserBudget.find({ ref_id: userRefID });
  
      const user = await UserModel.findOne({ _id: userRefID });
  
      const monthlySpending = {};
      userCards.forEach(entry => {
        const date = new Date(entry.datetime);
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!monthlySpending[yearMonth]) {
          monthlySpending[yearMonth] = [];
        }
        monthlySpending[yearMonth].push(entry);
      });
  
      const pdfFileUrls = [];
  
      for (const [yearMonth, spending] of Object.entries(monthlySpending)) {
        const doc = new PDFDocument();
  
        doc.fontSize(16).text(`User: ${user.name}`, { align: 'center' }).moveDown(0.5);
  
        spending.forEach(entry => {
          const date = new Date(entry.datetime);
          doc.fontSize(12).text(`Date: ${date.toDateString()}, Item: ${entry.item_name}, Price: Rs${entry.price}`).moveDown();
        });
  
        const totalSpending = spending.reduce((total, entry) => total + entry.price, 0);
        doc.fontSize(14).text(`Total Spending for ${yearMonth}: Rs${totalSpending}`).moveDown();
  
        const pdfBuffer = await new Promise((resolve, reject) => {
          const buffers = [];
          doc.on('data', buffers.push.bind(buffers));
          doc.on('end', () => {
            resolve(Buffer.concat(buffers));
          });
          doc.end();
        });
  
        const result = await cloudinary.uploader.upload_stream({
          resource_type: 'raw',
          format: 'pdf', // Specify the format as PDF
        }, (error, result) => {
          if (error) {
            console.error('Error uploading PDF to Cloudinary:', error);
            res.status(500).send('Error uploading PDF to Cloudinary');
          } else {
            pdfFileUrls.push(result.secure_url);
            if (pdfFileUrls.length === Object.keys(monthlySpending).length) {
              res.status(200).json({ pdfFileUrls });
            }
          }
        }).end(pdfBuffer);
      }
    } catch (error) {
      console.error('Error generating PDFs:', error);
      res.status(500).send('Error generating PDFs');
    }
  });




app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
