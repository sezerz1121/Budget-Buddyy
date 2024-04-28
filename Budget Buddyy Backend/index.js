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
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import { Transform, Readable } from 'stream';
import { createTransport } from 'nodemailer';
import UserPdf from "./UserPdf.js";
import {generatePDFExample} from "./pdfGeneration.js"
import {uploadOnCloudinary} from "./cloudinary.js"


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
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use('/pdf', express.static(path.join(__dirname, 'pdf')));

const secretKey = '123456789';
const port = 3000;

mongoose.connect(process.env.mangodb, {
    serverSelectionTimeoutMS: 5000
});

app.get('/profile', authenticateToken, async (req, res) => {
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
        const pdfPath = await generatePDFExample(userRefID);
        if(!pdfPath)
        {
           console.log("path not generated")
        }

        // Upload the PDF to Cloudinary if needed
         const pdf = await uploadOnCloudinary(pdfPath);
         if(!pdf)
        {
           console.log("pdf not generated")
        }

        // If you're not using Cloudinary, you can directly send the path as a response
        res.status(200).json({ message: pdf.secure_url });
        console.log("PDF url:", pdf.secure_url);

    } catch (error) {
        console.error('Error generating or uploading PDFs:', error);
        res.status(500).send('Error generating or uploading PDFs');
    }
});


app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
