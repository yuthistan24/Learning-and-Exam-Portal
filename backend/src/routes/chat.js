const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    // In a real production system, this would call Ollama/Gemini/Python Service
    // For now, providing intelligent mock responses to guide the student
    const lowerMessage = message.toLowerCase();
    let reply = "I am EduBot, your CSE Learning Assistant. I'm here to help you understand your coursework. Could you please specify your question?";

    if (lowerMessage.includes('c programming') || lowerMessage.includes('pointer')) {
      reply = "In C programming, a pointer is a variable that stores the memory address of another variable. Need help with syntax or arithmetic?";
    } else if (lowerMessage.includes('link') || lowerMessage.includes('list') || lowerMessage.includes('data structure')) {
      reply = "A linked list is a linear data structure, but unlike arrays, elements are not stored in contiguous memory. Each element points to the next. Which type do you want to learn: Singly, Doubly, or Circular?";
    } else if (lowerMessage.includes('acid') || lowerMessage.includes('dbms')) {
      reply = "ACID properties ensure database transaction reliability: Atomicity, Consistency, Isolation, and Durability. Which of these properties would you like an example for?";
    } else if (lowerMessage.includes('hello')) {
      reply = "Hello there! Let's conquer some Computer Science. Are you studying for Year 1 (Python, C) or Year 2 (Data Structures, DBMS)?";
    } else if (context === 'CS3301') {
      reply = "I see exploring Data Structures (CS3301). A great way to practice is implementing a Binary Search Tree from scratch. Shall I give you a template code?";
    } else if (context) {
      reply = `You are currently focusing on ${context}. What specific topic can I clarify for you?`;
    }

    // Simulate AI thinking time
    setTimeout(() => {
      res.json({ success: true, reply });
    }, 1000);

  } catch (error) {
    res.status(500).json({ success: false, message: 'Chatbot error' });
  }
});

module.exports = router;
