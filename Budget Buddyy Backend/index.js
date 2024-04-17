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

import stream from 'stream';
import pdf from 'html-pdf';
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

app.get('/generate-image', async (req, res) => {
    try {
        const userRefID = req.query._id;

        // Fetch user and spending data
        const [userCards, user] = await Promise.all([
            UserBudget.find({ ref_id: userRefID }).lean().exec(),
            UserModel.findOne({ _id: userRefID })
        ]);

        // Check if user or spending data is missing
        if (!user || !userCards) {
            console.error('User or spending data not found');
            return res.status(404).send('User or spending data not found');
        }

        // Check if user cards data is empty
        if (!Array.isArray(userCards) || userCards.length === 0) {
            console.error('User cards data is not an array or empty');
            return res.status(404).send('User cards data is not found or empty');
        }

        // Group spending data by month
        const monthlySpending = {};
        userCards.forEach(entry => {
            const date = new Date(entry.datetime);
            const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!monthlySpending[yearMonth]) {
                monthlySpending[yearMonth] = [];
            }
            monthlySpending[yearMonth].push(entry);
        });

        // Generate HTML content for each month's spending
        const generateHTML = (userName, yearMonth, spending, totalSpending) => {
            let html = `<h1>User: ${userName}</h1><br>`;
            html += `<h2>Spending for ${yearMonth}</h2>`;
            spending.forEach(entry => {
                const date = new Date(entry.datetime);
                html += `<p>Date: ${date.toDateString()}, Item: ${entry.item_name}, Price: Rs${entry.price}</p><br>`;
            });
            html += `<p>Total Spending for ${yearMonth}: Rs${totalSpending}</p>`;
            return html;
        };

        // Generate and upload image for each month's spending
        const generateAndUploadImage = async (yearMonth, spending) => {
            console.log('Generating image for:', yearMonth);
            const totalSpending = spending.reduce((total, entry) => total + entry.price, 0);
            console.log('Total spending for', yearMonth, ': Rs', totalSpending);
            const html = generateHTML(user.name, yearMonth, spending, totalSpending);
            const options = { format: 'Letter' };

            // Create PDF buffer from HTML content
            const buffer = await new Promise((resolve, reject) => {
                pdf.create(html, options).toBuffer((err, buffer) => {
                    if (err) reject(err);
                    resolve(buffer);
                });
            });

            // Upload PDF buffer to Cloudinary
            cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
                if (error) {
                    console.error('Error uploading image to Cloudinary:', error);
                    throw error;
                }
                console.log('Image uploaded successfully:', result.secure_url);

                // Store image document in the database
                const imageDocument = {
                    ref_id: userRefID,
                    time: new Date().toISOString(),
                    link: result.secure_url
                };
                console.log('Image document:', imageDocument);

                UserPdf.create(imageDocument)
                    .then(doc => {
                        console.log('Image document stored in the database:', doc);
                    })
                    .catch(err => {
                        console.error('Error storing image document in the database:', err);
                        throw err;
                    });
            }).end(buffer); // Pipe PDF buffer to upload stream
        };

        // Generate and upload images for all months
        const imageUrlsPromises = Object.entries(monthlySpending).map(([yearMonth, spending]) => {
            return generateAndUploadImage(yearMonth, spending);
        });

        // Wait for all images to be generated and uploaded
        await Promise.all(imageUrlsPromises);

        // Send success response
        res.status(200).send('Images generated and stored successfully');
    } catch (error) {
        // Handle errors
        console.error('Error generating or uploading images:', error);
        res.status(500).send('Error generating or uploading images');
    }
});


app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
