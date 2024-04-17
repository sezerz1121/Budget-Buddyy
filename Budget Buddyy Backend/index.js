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

        const [userCards, user] = await Promise.all([
            UserBudget.find({ ref_id: userRefID }).lean().exec(),
            UserModel.findOne({ _id: userRefID })
        ]);


        if (!user || !userCards) {
            console.error('User or spending data not found');
            return res.status(404).send('User or spending data not found');
        }

        
        if (!Array.isArray(userCards) || userCards.length === 0) {
            console.error('User cards data is not an array or empty');
            return res.status(404).send('User cards data is not found or empty');
        }

        const monthlySpending = {};
        userCards.forEach(entry => {
            const date = new Date(entry.datetime);
            const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!monthlySpending[yearMonth]) {
                monthlySpending[yearMonth] = [];
            }
            monthlySpending[yearMonth].push(entry);
        });

        
        


        const generateAndUploadPDF = async (yearMonth, spending) => {
            console.log('Generating PDF for:', yearMonth);
            return new Promise(async (resolve, reject) => {
                const doc = new PDFDocument();
                const buffers = [];
                doc.fontSize(16).text(`User: ${user.name}`, { align: 'center' }).moveDown(0.5);
                spending.forEach(entry => {
                    const date = new Date(entry.datetime);
                    doc.fontSize(12).text(`Date: ${date.toDateString()}, Item: ${entry.item_name}, Price: Rs${entry.price}`).moveDown();
                });
                const totalSpending = spending.reduce((total, entry) => total + entry.price, 0);
                doc.fontSize(14).text(`Total Spending for ${yearMonth}: Rs${totalSpending}`).moveDown();
                const transformer = new Transform({
                    transform(chunk, encoding, callback) {
                        buffers.push(chunk);
                        callback();
                    }
                });
                doc.pipe(transformer);
                transformer.on('finish', async () => {
                    try {
                        const pdfBuffer = Buffer.concat(buffers);
                        
                        console.log('Uploading PDF to Cloudinary...');
                        
                        // Create a readable stream from the PDF buffer
                        const pdfStream = new Readable();
                        pdfStream.push(pdfBuffer);
                        pdfStream.push(null); // Close the stream
                        
                        // Upload the PDF stream directly to Cloudinary
                       cloudinary.uploader.upload_stream({ resource_type: 'raw', format: 'pdf' },
                        (error, result) => {
                            if (error) {
                                console.error('Error uploading PDF to Cloudinary:', error);
                                reject(error);
                            } else {
                                console.log('Cloudinary response:', result);
                                console.log('PDF uploaded successfully:', result.secure_url);
                                resolve(result.secure_url);
                            }
                        }
                    ).end(pdfBuffer); // End the stream with the PDF buffer
                    // End the stream with the PDF buffer
                    } catch (error) {
                        console.error('Error generating or uploading PDF:', error);
                        reject(error);
                    }
                });
                doc.end();
            });
        };


        
        

        
        const pdfUrlsPromises = Object.entries(monthlySpending).map(([yearMonth, spending]) => {
            return generateAndUploadPDF(yearMonth, spending);
        });

        
        const pdfUrls = await Promise.all(pdfUrlsPromises);
        console.log('PDFs generated and uploaded:', pdfUrls);

        
        const pdfDocuments = pdfUrls.map(url => ({
            ref_id: userRefID,
            time: new Date().toISOString(),
            link: url
        }));
        await UserPdf.create(pdfDocuments);
        console.log('PDF documents stored in the database:', pdfDocuments);

        
        res.status(200).send('PDFs generated and stored successfully');
    } catch (error) {
       
        console.error('Error generating or uploading PDFs:', error);
        res.status(500).send('Error generating or uploading PDFs');
    }
});


app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
