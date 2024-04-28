import PDFDocument from 'pdfkit';
import fs from "fs";
import UserBudget from './UserBudget.js';
import UserModel from './UserModel.js';

const generatePDFExample = async (userId) => {
    try {
        // Find the user by ID
        const user = await UserModel.findById(userId);

        // Check if user exists
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        // Get the current date
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // Month is zero-indexed, so add 1

        // Find budgets associated with the user for the current month
        const budgets = await UserBudget.find({
            ref_id: userId,
            $expr: {
                $eq: [{ $year: "$datetime" }, currentYear],
                $eq: [{ $month: "$datetime" }, currentMonth]
            }
        });

        // Create PDF document
        const doc = new PDFDocument();

        // Write user information to the PDF document
        doc.fontSize(16).text(`User: ${user.name}`, { align: 'center' }).moveDown(0.5);

        // Write budget entries to the PDF document
        if (budgets.length > 0) {
            doc.fontSize(14).text('Budget Entries:').moveDown();
            let totalSpending = 0;
            budgets.forEach((budget, index) => {
                const date = new Date(budget.datetime);
                doc.fontSize(12).text(`Entry ${index + 1}:`);
                doc.text(`Item: ${budget.item_name}, Price: Rs${budget.price}`);
                doc.text(`Date: ${date.toDateString()}`).moveDown();
                totalSpending += budget.price;
            });
            // Write total spending for the current month
            doc.fontSize(14).text(`Total Spending for Current Month: Rs${totalSpending}`).moveDown();
        } else {
            doc.text('No budget entries found for the current month').moveDown();
        }

        // Generate a unique path for the PDF
        const path = `temp/user_${userId}_example.pdf`;

        // Pipe PDF content to a write stream
        const writeStream = fs.createWriteStream(path);
        doc.pipe(writeStream);

        // Finalize the PDF document
        doc.end();

        return path;
    } catch (error) {
        throw new Error(`Error generating PDF example: ${error.message}`);
    }
};

export { generatePDFExample };
