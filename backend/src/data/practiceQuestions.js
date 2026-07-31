module.exports = {
  // C Programming & Data Structures
  "Arrays": {
    text: "### Scenario: The Sensor Data Reverser\n\nYou are building a data logging system for a weather station. The station records temperature readings every hour, but due to a hardware quirk, the data is stored in reverse chronological order (newest to oldest). To process the data correctly, you need to write a program that reverses the sequence of readings in-place.\n\n**Task:** Write a C program that reads the number of readings `N`, followed by `N` integers representing the temperatures. Reverse the array in-place and print the corrected chronological sequence separated by spaces.",
    testCases: [{ input: "4\n22 24 21 19", expectedOutput: "19 21 24 22" }, { input: "3\n10 20 30", expectedOutput: "30 20 10" }]
  },
  "Linked Lists": {
    text: "### Scenario: The Music Playlist Manager\n\nYou are creating a simple music player. Songs are represented as nodes in a singly linked list. A common feature requested by users is to 'jump to the middle' of their playlist. \n\n**Task:** Implement a singly linked list. Read a sequence of integers (representing song IDs) separated by spaces. Write a function using the 'fast and slow pointer' technique to find and print the middle element of the playlist.",
    testCases: [{ input: "10 20 30 40 50", expectedOutput: "30" }, { input: "1 2 3 4 5 6 7", expectedOutput: "4" }]
  },
  "Stacks": {
    text: "### Scenario: The Browser History Back Button\n\nEvery time a user visits a web page, the URL is pushed onto a stack. When they click the 'Back' button, the top URL is popped off. \n\n**Task:** Implement a Stack using an array. Read an integer `N`, followed by `N` integers representing page IDs visited. Push all `N` elements onto the stack. Then, simulate the user pressing 'Back' `N` times by popping and printing all elements separated by spaces.",
    testCases: [{ input: "3\n101 102 103", expectedOutput: "103 102 101" }]
  },
  "Queues": {
    text: "### Scenario: The Print Job Spooler\n\nIn a busy office, multiple computers send documents to a single shared printer. The printer processes jobs in the exact order they arrive (First-In, First-Out). \n\n**Task:** Implement a Queue. Read an integer `N`, followed by `N` document IDs. Enqueue all documents into the printer's queue, then simulate printing by dequeuing and printing them separated by spaces.",
    testCases: [{ input: "4\n55 66 77 88", expectedOutput: "55 66 77 88" }]
  },
  "Bubble Sort and Selection Sort": {
    text: "### Scenario: The Leaderboard Ranker\n\nA local gaming tournament needs to display players' scores from lowest to highest. The tournament organizers want you to use Bubble Sort to arrange the scores.\n\n**Task:** Implement Bubble Sort. Read an integer `N`, followed by `N` integers. Sort the array in ascending order and print the result.",
    testCases: [{ input: "5\n45 12 89 33 21", expectedOutput: "12 21 33 45 89" }]
  },
  "Binary Search": {
    text: "### Scenario: The Library Catalog Search\n\nA massive digital library assigns a unique ID to every book, stored in a sorted database. To quickly find if a specific book exists, you must use Binary Search.\n\n**Task:** Read an integer `N`, followed by `N` sorted integers. Then read a target integer `T`. Use Binary Search to find the index (0-based) of `T`. If not found, output `-1`.",
    testCases: [{ input: "5\n10 20 30 40 50\n40", expectedOutput: "3" }, { input: "4\n2 4 6 8\n5", expectedOutput: "-1" }]
  },
  
  // Python Programming
  "Variables and Data Types": {
    text: "### Scenario: The Data Pipeline Initializer\n\nYou are building an ETL (Extract, Transform, Load) pipeline in Python. The first step is to parse incoming raw string data into appropriate Python data types: an integer, a float, and a string.\n\n**Task:** Write a Python program that reads three lines from standard input: an integer (user age), a float (account balance), and a string (user name). Print them on a single line separated by commas.",
    testCases: [{ input: "25\n150.50\nAlice", expectedOutput: "25, 150.5, Alice" }]
  },
  "Conditional Statements": {
    text: "### Scenario: The Calendar Widget\n\nYou are developing a calendar application. A crucial function is accurately determining if a given year is a leap year to properly render February.\n\n**Task:** Write a Python program that reads a year `Y`. Print `True` if it is a leap year, otherwise print `False`.",
    testCases: [{ input: "2024", expectedOutput: "True" }, { input: "1900", expectedOutput: "False" }]
  },
  
  // Java Programming
  "Classes and Objects": {
    text: "### Scenario: The Student Management System\n\nA university needs a system to model its students. Object-Oriented Programming (OOP) is perfect for this.\n\n**Task:** Create a Java class named `Student` with attributes `name` (String) and `marks` (int). Provide a constructor to initialize them. In the `Main` class, read a string and an integer, instantiate a `Student`, and print `Name: [name], Marks: [marks]`.",
    testCases: [{ input: "Bob 85", expectedOutput: "Name: Bob, Marks: 85" }]
  },
  "Exception Handling": {
    text: "### Scenario: The Robust Calculator\n\nYou are building the core engine for a financial calculator. It must never crash, even if a user accidentally attempts to divide a portfolio value by zero.\n\n**Task:** Write a Java program that reads two integers. Try to divide the first by the second. Use a `try-catch` block to handle `ArithmeticException`. If successful, print the result. If division by zero occurs, print `Error: Division by zero`.",
    testCases: [{ input: "100 5", expectedOutput: "20" }, { input: "50 0", expectedOutput: "Error: Division by zero" }]
  },
  
  // Design and Analysis of Algorithms
  "Merge Sort": {
    text: "### Scenario: The Distributed Database Sorter\n\nYou are optimizing a database that splits large datasets across multiple servers, sorts them, and merges them back together. This is the core concept of Merge Sort.\n\n**Task:** Implement Merge Sort to sort an array in ascending order. Read `N`, followed by `N` integers. Print the sorted array.",
    testCases: [{ input: "6\n12 11 13 5 6 7", expectedOutput: "5 6 7 11 12 13" }]
  }
};

