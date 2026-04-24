const fs = require('fs');
const pdf = require('pdf-parse-fork');

async function extractSyllabus() {
    try {
        const dataBuffer = fs.readFileSync('syllabus.pdf');
        const data = await pdf(dataBuffer);
        
        console.log('Extracted text length:', data.text.length);
        
        // Save a portion of the text to help me understand the structure
        fs.writeFileSync('C:\\Users\\yuthg\\.gemini\\antigravity\\brain\\040c67ce-7fba-4604-b05a-e4cd74522f33\\syllabus_extracted.txt', data.text.substring(0, 50000));
        
        console.log('Successfully extracted text to syllabus_extracted.txt');
    } catch (err) {
        console.error('Error parsing PDF:', err);
    }
}

extractSyllabus();
