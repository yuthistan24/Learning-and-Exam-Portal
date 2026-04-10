const pdf = require('pdf-parse-fork');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const fs = require('fs');

// Extract raw text from uploaded PDF
exports.uploadAndExtractText = async (req, res) => {
  try {
    if (!req.file) {
      throw new AppError('Please upload a PDF file', 400);
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdf(dataBuffer);

    // Clean up the uploaded file immediately
    fs.unlinkSync(req.file.path);

    logger.info(`Extracted text from PDF: ${req.file.originalname}`);

    res.json({
      text: data.text,
      numPages: data.numpages,
      info: data.info
    });
  } catch (error) {
    logger.error(`PDF Extraction Error: ${error.message}`);
    throw error;
  }
};

// Parse raw text into potential question objects
exports.parseTextToQuestions = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      throw new AppError('No text provided for parsing', 400);
    }

    // Regex patterns for common question formats:
    // 1. "Question 1:", "Q1.", "1." at start of line
    // 2. MCQ options like "a)", "A)", "1)"
    const questionSplitter = /(\n\s*(?:Question\s*\d+|Q\d+|^\d+)(?::|\.)\s*)/gi;
    const optionsSplitter = /\n\s*([a-dD]\)|[1-4]\))\s*/g;

    const segments = text.split(questionSplitter);
    const potentialQuestions = [];

    // segments[0] is usually preamble. We loop through pairs of (marker, content)
    for (let i = 1; i < segments.length; i += 2) {
      const marker = segments[i];
      const content = segments[i + 1] || '';

      const fullText = (marker + content).trim();

      // Detect if it's likely an MCQ
      const options = [];
      const optMatches = content.matchAll(optionsSplitter);
      for (const match of optMatches) {
        options.push({
          text: content.substring(match.index + match[0].length, content.indexOf('\n', match.index + match[0].length)).trim(),
          isCorrect: false // Teacher must mark the correct one
        });
      }

      const type = options.length >= 2 ? 'mcq' : 'short_answer';

      potentialQuestions.push({
        text: fullText,
        type: type,
        marks: 1, // Default
        options: options,
        rubric: {
          keywords: [],
          answerKey: '',
          method: 'keyword'
        }
      });
    }

    res.json({
      count: potentialQuestions.length,
      questions: potentialQuestions
    });
  } catch (error) {
    logger.error(`Parsing Error: ${error.message}`);
    throw error;
  }
};
