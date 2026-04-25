// R2024 CSE Curriculum — Kongu Engineering College (CORRECTED from official syllabus)
// Theory courses from Semesters 1–4

module.exports = [
  // ═══════════════════════════════════════════════
  //  SEMESTER 1
  // ═══════════════════════════════════════════════
  {
    title: "English for Effective Communication",
    code: "24EGT11",
    semester: 1, credits: 3, totalMarks: 100, department: "ENGLISH",
    description: "Foundational English communication skills — LSRW for engineering contexts.",
    units: [
      { number: 1, title: "Listening and Note-Making", topics: ["Active Listening Strategies", "Note-Making Techniques", "Comprehension Exercises", "Audio Analysis"], marks: 20 },
      { number: 2, title: "Speaking Skills", topics: ["Self Introduction", "Describing Processes", "Group Discussion Basics", "Telephonic Conversation"], marks: 20 },
      { number: 3, title: "Reading Comprehension", topics: ["Skimming and Scanning", "Inferential Reading", "Critical Reading", "Vocabulary Building"], marks: 20 },
      { number: 4, title: "Writing Skills", topics: ["Paragraph Writing", "Letter Writing – Formal", "Email Etiquette", "Précis Writing"], marks: 20 },
      { number: 5, title: "Grammar and Usage", topics: ["Tenses and Subject-Verb Agreement", "Active and Passive Voice", "Reported Speech", "Common Errors in English"], marks: 20 }
    ]
  },
  {
    title: "Matrices and Ordinary Differential Equations",
    code: "24MAC11",
    semester: 1, credits: 4, totalMarks: 100, department: "MATHS",
    description: "Eigenvalues, eigenvectors, matrix diagonalisation, and methods for solving first- and higher-order ODEs.",
    units: [
      { number: 1, title: "Matrices", topics: ["Types of Matrices", "Eigenvalues and Eigenvectors", "Cayley-Hamilton Theorem", "Diagonalisation of Matrices"], marks: 20 },
      { number: 2, title: "First Order ODE", topics: ["Exact Equations", "Integrating Factors", "Bernoulli's Equation", "Applications of First Order ODE"], marks: 20 },
      { number: 3, title: "Higher Order ODE", topics: ["Linear Higher Order ODE", "Method of Undetermined Coefficients", "Variation of Parameters", "Euler-Cauchy Equation"], marks: 20 },
      { number: 4, title: "Laplace Transforms", topics: ["Definition and Properties", "Inverse Laplace Transform", "Solving ODE using Laplace", "Convolution Theorem"], marks: 20 },
      { number: 5, title: "Fourier Series", topics: ["Fourier Series Expansion", "Half-Range Series", "Parseval's Identity", "Applications of Fourier Series"], marks: 20 }
    ]
  },
  {
    title: "Physics for Computer Systems",
    code: "24PHT11",
    semester: 1, credits: 3, totalMarks: 100, department: "PHYSICS",
    description: "Semiconductor physics, laser technology, fiber optics, and nanomaterials relevant to computing.",
    units: [
      { number: 1, title: "Semiconductor Physics", topics: ["Energy Band Theory", "Intrinsic and Extrinsic Semiconductors", "PN Junction", "Hall Effect"], marks: 20 },
      { number: 2, title: "Laser and Fiber Optics", topics: ["Laser Principles", "Types of Lasers", "Fiber Optic Communication", "Numerical Aperture"], marks: 20 },
      { number: 3, title: "Quantum Mechanics", topics: ["Wave-Particle Duality", "Schrödinger Equation", "Particle in a Box", "Tunneling Effect"], marks: 20 },
      { number: 4, title: "Magnetic and Dielectric Materials", topics: ["Diamagnetism and Paramagnetism", "Ferromagnetism", "Dielectric Polarisation", "Applications in Computing"], marks: 20 },
      { number: 5, title: "Nanoscience and Nanotechnology", topics: ["Nanoscale Systems", "Carbon Nanotubes", "Quantum Dots", "Applications in Electronics"], marks: 20 }
    ]
  },
  {
    title: "Programming in C",
    code: "24CSC12",
    semester: 1, credits: 3, totalMarks: 100, department: "CSE",
    description: "Fundamentals of structured programming using C — pointers, arrays, structures and file I/O.",
    units: [
      { number: 1, title: "C Fundamentals", topics: ["Data Types and Variables", "Operators and Expressions", "Input/Output Functions", "Type Casting"], marks: 20 },
      { number: 2, title: "Control Structures", topics: ["Conditional Statements (if, switch)", "Looping (for, while, do-while)", "Break and Continue", "Nested Loops"], marks: 20 },
      { number: 3, title: "Functions and Recursion", topics: ["Function Declaration and Definition", "Parameter Passing", "Recursion", "Storage Classes"], marks: 20 },
      { number: 4, title: "Arrays, Strings and Pointers", topics: ["1D and 2D Arrays", "String Functions", "Pointer Arithmetic", "Dynamic Memory Allocation"], marks: 20 },
      { number: 5, title: "Structures and File Handling", topics: ["Structures and Unions", "Typedef and Enum", "File Operations", "Command Line Arguments"], marks: 20 }
    ]
  },
  {
    title: "Problem Solving and Web Design",
    code: "24CSC13",
    semester: 1, credits: 3, totalMarks: 100, department: "CSE",
    description: "Algorithmic problem solving, HTML, CSS and introductory JavaScript for web page creation.",
    units: [
      { number: 1, title: "Problem Solving Strategies", topics: ["Algorithms and Flowcharts", "Pseudocode", "Decomposition", "Computational Thinking"], marks: 20 },
      { number: 2, title: "HTML Fundamentals", topics: ["HTML Document Structure", "Text Formatting Tags", "Lists and Tables", "Forms and Input Elements"], marks: 20 },
      { number: 3, title: "CSS Styling", topics: ["Selectors and Properties", "Box Model", "Flexbox Layout", "Responsive Design Basics"], marks: 20 },
      { number: 4, title: "JavaScript Basics", topics: ["Variables and Data Types", "Control Structures", "Functions", "DOM Manipulation"], marks: 20 },
      { number: 5, title: "Web Page Projects", topics: ["Event Handling", "Form Validation", "Building a Portfolio Page", "Hosting and Deployment Basics"], marks: 20 }
    ]
  },
  {
    title: "Quantitative Aptitude – I",
    code: "24MNT12",
    semester: 1, credits: 2, totalMarks: 100, department: "MATHS",
    description: "Number systems, percentages, ratio & proportion, profit & loss — foundational quantitative reasoning.",
    units: [
      { number: 1, title: "Number Systems", topics: ["HCF and LCM", "Divisibility Rules", "Remainder Theorem", "Number Series"], marks: 20 },
      { number: 2, title: "Percentage and Profit/Loss", topics: ["Percentage Calculations", "Successive Percentages", "Profit, Loss and Discount", "Marked Price"], marks: 20 },
      { number: 3, title: "Ratio, Proportion and Partnership", topics: ["Ratio and Proportion", "Direct and Inverse Proportion", "Partnership Problems", "Mixtures and Alligation"], marks: 20 },
      { number: 4, title: "Time, Speed and Work", topics: ["Time and Distance", "Relative Speed", "Time and Work", "Pipes and Cisterns"], marks: 20 },
      { number: 5, title: "Averages and Ages", topics: ["Simple and Weighted Average", "Ages Problems", "Calendar Problems", "Clock Problems"], marks: 20 }
    ]
  },

  // ═══════════════════════════════════════════════
  //  SEMESTER 2
  // ═══════════════════════════════════════════════
  {
    title: "English for Effective Communication – II",
    code: "24EGT21",
    semester: 2, credits: 3, totalMarks: 100, department: "ENGLISH",
    description: "Advanced technical writing, presentation skills, and professional communication for engineers.",
    units: [
      { number: 1, title: "Technical Writing", topics: ["Report Writing", "Technical Description", "Process Description", "Instruction Writing"], marks: 20 },
      { number: 2, title: "Presentation Skills", topics: ["Oral Presentation Techniques", "Visual Aids and PPT Design", "Audience Engagement", "Handling Q&A Sessions"], marks: 20 },
      { number: 3, title: "Professional Correspondence", topics: ["Business Letters", "Memo Writing", "Minutes of Meeting", "Proposal Writing"], marks: 20 },
      { number: 4, title: "Group Communication", topics: ["Group Discussion", "Debate Skills", "Role Play and Simulation", "Interview Skills"], marks: 20 },
      { number: 5, title: "Advanced Grammar", topics: ["Complex Sentences", "Conditional Clauses", "Phrasal Verbs and Idioms", "Editing and Proofreading"], marks: 20 }
    ]
  },
  {
    title: "Probability and Statistics",
    code: "24MAC23",
    semester: 2, credits: 4, totalMarks: 100, department: "MATHS",
    description: "Probability distributions, statistical inference, regression, and hypothesis testing for data science.",
    units: [
      { number: 1, title: "Probability Theory", topics: ["Axioms of Probability", "Conditional Probability", "Bayes' Theorem", "Random Variables"], marks: 20 },
      { number: 2, title: "Distribution Theory", topics: ["Binomial Distribution", "Poisson Distribution", "Normal Distribution", "Exponential Distribution"], marks: 20 },
      { number: 3, title: "Sampling and Estimation", topics: ["Sampling Distributions", "Central Limit Theorem", "Point and Interval Estimation", "Confidence Intervals"], marks: 20 },
      { number: 4, title: "Hypothesis Testing", topics: ["Z-Test and T-Test", "Chi-Square Test", "F-Test (ANOVA)", "Non-Parametric Tests"], marks: 20 },
      { number: 5, title: "Regression and Correlation", topics: ["Simple Linear Regression", "Multiple Regression", "Correlation Coefficient", "Curve Fitting"], marks: 20 }
    ]
  },
  {
    title: "Chemistry for Electronics and Computer Systems",
    code: "24CYT13",
    semester: 2, credits: 3, totalMarks: 100, department: "CHEMISTRY",
    description: "Electrochemistry, polymers, corrosion science, and material chemistry relevant to computer hardware.",
    units: [
      { number: 1, title: "Electrochemistry and Corrosion", topics: ["Electrochemical Cells", "Nernst Equation", "Types of Corrosion", "Corrosion Prevention Methods"], marks: 20 },
      { number: 2, title: "Polymers and Composites", topics: ["Types of Polymers", "Polymerisation Processes", "Conducting Polymers", "Composite Materials"], marks: 20 },
      { number: 3, title: "Surface Chemistry and Catalysis", topics: ["Adsorption Isotherms", "Colloids", "Catalysis Types", "Applications in Industry"], marks: 20 },
      { number: 4, title: "Water Technology", topics: ["Water Treatment Methods", "Desalination", "Boiler Feed Water", "Waste Water Treatment"], marks: 20 },
      { number: 5, title: "Energy Sources", topics: ["Fuels Classification", "Solar Cells", "Fuel Cells", "Nuclear Energy Basics"], marks: 20 }
    ]
  },
  {
    title: "Structured Programming and Linear Data Structures",
    code: "24CSC21",
    semester: 2, credits: 4, totalMarks: 100, department: "CSE",
    description: "Advanced C programming with linear data structures — arrays, linked lists, stacks, and queues.",
    units: [
      { number: 1, title: "Advanced C Concepts", topics: ["Pointers and Memory Management", "Multi-dimensional Arrays", "Function Pointers", "Preprocessor Directives"], marks: 20 },
      { number: 2, title: "Linked Lists", topics: ["Singly Linked List", "Doubly Linked List", "Circular Linked List", "Applications of Linked Lists"], marks: 20 },
      { number: 3, title: "Stacks", topics: ["Stack ADT", "Array and Linked List Implementation", "Infix to Postfix Conversion", "Expression Evaluation"], marks: 20 },
      { number: 4, title: "Queues", topics: ["Queue ADT", "Circular Queue", "Priority Queue", "Deque"], marks: 20 },
      { number: 5, title: "Sorting and Searching", topics: ["Bubble Sort and Selection Sort", "Insertion Sort and Merge Sort", "Linear Search", "Binary Search"], marks: 20 }
    ]
  },
  {
    title: "Object Oriented Programming using C++",
    code: "24CSC22",
    semester: 2, credits: 3, totalMarks: 100, department: "CSE",
    description: "OOP principles using C++ — classes, inheritance, polymorphism, templates and STL.",
    units: [
      { number: 1, title: "C++ Fundamentals", topics: ["Classes and Objects", "Constructors and Destructors", "Access Specifiers", "Friend Functions"], marks: 20 },
      { number: 2, title: "Inheritance", topics: ["Single and Multiple Inheritance", "Virtual Base Classes", "Constructor in Inheritance", "Ambiguity Resolution"], marks: 20 },
      { number: 3, title: "Polymorphism", topics: ["Function Overloading", "Operator Overloading", "Virtual Functions", "Pure Virtual Functions and Abstract Classes"], marks: 20 },
      { number: 4, title: "Templates and Exception Handling", topics: ["Function Templates", "Class Templates", "Try-Catch-Throw", "Standard Exceptions"], marks: 20 },
      { number: 5, title: "STL and File Handling", topics: ["Vectors and Lists", "Maps and Sets", "Iterators", "File I/O Streams"], marks: 20 }
    ]
  },
  {
    title: "Quantitative Aptitude – II",
    code: "24MNT21",
    semester: 2, credits: 2, totalMarks: 100, department: "MATHS",
    description: "Logical reasoning, data interpretation, and advanced quantitative problem solving.",
    units: [
      { number: 1, title: "Logical Reasoning – I", topics: ["Coding and Decoding", "Blood Relations", "Direction Sense", "Seating Arrangement"], marks: 20 },
      { number: 2, title: "Logical Reasoning – II", topics: ["Syllogisms", "Statements and Assumptions", "Data Sufficiency", "Puzzles"], marks: 20 },
      { number: 3, title: "Data Interpretation", topics: ["Bar Graphs and Pie Charts", "Line Graphs", "Tables", "Caselets"], marks: 20 },
      { number: 4, title: "Advanced Arithmetic", topics: ["Simple and Compound Interest", "Permutations and Combinations", "Probability Basics", "Mensuration"], marks: 20 },
      { number: 5, title: "Verbal Ability", topics: ["Sentence Completion", "Para Jumbles", "Reading Comprehension", "Critical Reasoning"], marks: 20 }
    ]
  },

  // ═══════════════════════════════════════════════
  //  SEMESTER 3
  // ═══════════════════════════════════════════════
  {
    title: "Discrete Mathematical Structures",
    code: "24MAT31",
    semester: 3, credits: 4, totalMarks: 100, department: "MATHS",
    description: "Logic, set theory, combinatorics, relations, graph theory — mathematical foundations for CS.",
    units: [
      { number: 1, title: "Mathematical Logic", topics: ["Propositional Logic", "Predicate Logic", "Logical Equivalences", "Proof Techniques"], marks: 20 },
      { number: 2, title: "Set Theory and Relations", topics: ["Sets and Operations", "Relations and Properties", "Equivalence Relations", "Partial Ordering"], marks: 20 },
      { number: 3, title: "Functions and Counting", topics: ["Types of Functions", "Permutations and Combinations", "Pigeonhole Principle", "Recurrence Relations"], marks: 20 },
      { number: 4, title: "Graph Theory", topics: ["Graph Terminology", "Euler and Hamiltonian Paths", "Planar Graphs", "Graph Colouring"], marks: 20 },
      { number: 5, title: "Algebraic Structures", topics: ["Groups", "Rings and Fields", "Boolean Algebra", "Lattices"], marks: 20 }
    ]
  },
  {
    title: "Java Programming",
    code: "24CSC31",
    semester: 3, credits: 3, totalMarks: 100, department: "CSE",
    description: "Core Java — OOP principles, exception handling, multithreading, collections, and I/O.",
    units: [
      { number: 1, title: "Java Fundamentals", topics: ["JDK, JRE and JVM", "Data Types and Operators", "Control Structures", "Arrays and Strings"], marks: 20 },
      { number: 2, title: "Classes and Inheritance", topics: ["Classes and Objects", "Constructors", "Inheritance Types", "Method Overriding and super"], marks: 20 },
      { number: 3, title: "Interfaces and Packages", topics: ["Interface Declaration", "Abstract Classes vs Interfaces", "Packages and Access Control", "Nested and Inner Classes"], marks: 20 },
      { number: 4, title: "Exception Handling and Multithreading", topics: ["Try-Catch-Finally", "Custom Exceptions", "Thread Creation and Lifecycle", "Synchronization"], marks: 20 },
      { number: 5, title: "Collections and I/O", topics: ["ArrayList, LinkedList, HashMap", "Iterator and Streams", "File I/O", "Serialization"], marks: 20 }
    ]
  },
  {
    title: "Data Structures",
    code: "24CST31",
    semester: 3, credits: 4, totalMarks: 100, department: "CSE",
    description: "Non-linear data structures — trees, graphs, hashing, and advanced sorting algorithms.",
    units: [
      { number: 1, title: "Trees", topics: ["Binary Trees", "Tree Traversals", "Binary Search Trees", "AVL Trees"], marks: 20 },
      { number: 2, title: "Heaps and Priority Queues", topics: ["Min Heap and Max Heap", "Heap Sort", "Priority Queue", "Binomial Heap"], marks: 20 },
      { number: 3, title: "Graphs", topics: ["Graph Representation", "BFS and DFS", "Shortest Path Algorithms", "Minimum Spanning Tree"], marks: 20 },
      { number: 4, title: "Hashing", topics: ["Hash Functions", "Collision Resolution", "Open Addressing", "Separate Chaining"], marks: 20 },
      { number: 5, title: "Advanced Data Structures", topics: ["Tries", "B-Trees", "Red-Black Trees", "Splay Trees"], marks: 20 }
    ]
  },
  {
    title: "Computer Organization",
    code: "24CST32",
    semester: 3, credits: 3, totalMarks: 100, department: "CSE",
    description: "Processor design, instruction sets, pipelining, memory hierarchy, and I/O interfacing.",
    units: [
      { number: 1, title: "Basic Computer Organization", topics: ["Von Neumann Architecture", "Instruction Cycle", "Register Transfer Language", "Micro-operations"], marks: 20 },
      { number: 2, title: "Instruction Set Architecture", topics: ["Addressing Modes", "RISC vs CISC", "Instruction Formats", "Assembly Language Basics"], marks: 20 },
      { number: 3, title: "Pipelining", topics: ["Pipeline Stages", "Pipeline Hazards", "Branch Prediction", "Superscalar Architecture"], marks: 20 },
      { number: 4, title: "Memory System", topics: ["Cache Memory", "Cache Mapping Techniques", "Virtual Memory", "Memory Interleaving"], marks: 20 },
      { number: 5, title: "I/O Organization", topics: ["I/O Interfaces", "DMA", "Interrupt Handling", "Bus Architecture"], marks: 20 }
    ]
  },
  {
    title: "Digital Logic and Design Principles",
    code: "24CST33",
    semester: 3, credits: 3, totalMarks: 100, department: "CSE",
    description: "Number systems, Boolean algebra, combinational and sequential circuit design.",
    units: [
      { number: 1, title: "Number Systems and Codes", topics: ["Binary, Octal and Hexadecimal", "BCD and Gray Code", "Signed Number Representation", "Binary Arithmetic"], marks: 20 },
      { number: 2, title: "Boolean Algebra and Logic Gates", topics: ["Boolean Laws and Theorems", "Logic Gates (AND, OR, NOT, XOR)", "Canonical Forms (SOP, POS)", "K-Map Simplification"], marks: 20 },
      { number: 3, title: "Combinational Circuits", topics: ["Adders (Half, Full, Ripple)", "Multiplexers and Demultiplexers", "Encoders and Decoders", "Comparators"], marks: 20 },
      { number: 4, title: "Sequential Circuits", topics: ["Latches (SR, D)", "Flip-Flops (JK, T, D)", "Registers and Shift Registers", "Counters (Ripple, Synchronous)"], marks: 20 },
      { number: 5, title: "Memory and Programmable Logic", topics: ["ROM and RAM Architecture", "PLA and PAL", "FPGA Basics", "State Machine Design"], marks: 20 }
    ]
  },

  // ═══════════════════════════════════════════════
  //  SEMESTER 4
  // ═══════════════════════════════════════════════
  {
    title: "Python Programming and Frameworks",
    code: "24CSC41",
    semester: 4, credits: 3, totalMarks: 100, department: "CSE",
    description: "Python programming — data types, OOP, file handling, and popular frameworks (Flask/Django).",
    units: [
      { number: 1, title: "Python Basics", topics: ["Variables and Data Types", "Operators", "Strings and String Methods", "Input/Output Operations"], marks: 20 },
      { number: 2, title: "Control Flow and Functions", topics: ["Conditional Statements", "Loops (for, while)", "User-Defined Functions", "Lambda and Higher-Order Functions"], marks: 20 },
      { number: 3, title: "Data Structures in Python", topics: ["Lists and Tuples", "Dictionaries and Sets", "List Comprehensions", "Iterators and Generators"], marks: 20 },
      { number: 4, title: "OOP and File Handling", topics: ["Classes and Objects", "Inheritance and Polymorphism", "Exception Handling", "File Read/Write Operations"], marks: 20 },
      { number: 5, title: "Python Frameworks", topics: ["Flask Basics", "Django Overview", "REST API Development", "Database Integration with ORM"], marks: 20 }
    ]
  },
  {
    title: "Full Stack Development",
    code: "24CSC42",
    semester: 4, credits: 3, totalMarks: 100, department: "CSE",
    description: "End-to-end web development — React/Angular frontend, Node.js/Express backend, and MongoDB.",
    units: [
      { number: 1, title: "Frontend Fundamentals", topics: ["Advanced HTML5 and CSS3", "JavaScript ES6+", "Responsive Design", "CSS Frameworks (Bootstrap)"], marks: 20 },
      { number: 2, title: "Frontend Frameworks", topics: ["React.js Fundamentals", "Components and Props", "State Management", "Routing and Navigation"], marks: 20 },
      { number: 3, title: "Backend Development", topics: ["Node.js and Express.js", "RESTful API Design", "Middleware and Error Handling", "Authentication (JWT)"], marks: 20 },
      { number: 4, title: "Database Integration", topics: ["MongoDB and Mongoose", "CRUD Operations", "Data Modelling", "Aggregation Pipeline"], marks: 20 },
      { number: 5, title: "Deployment and DevOps", topics: ["Version Control (Git)", "Docker Basics", "CI/CD Pipeline", "Cloud Deployment (AWS/Heroku)"], marks: 20 }
    ]
  },
  {
    title: "Database Management Systems",
    code: "24CST41",
    semester: 4, credits: 4, totalMarks: 100, department: "CSE",
    description: "Relational model, SQL, transactions, normalization, and NoSQL databases.",
    units: [
      { number: 1, title: "Relational Model", topics: ["ER Diagrams", "Relational Algebra", "Relational Calculus", "Keys and Constraints"], marks: 20 },
      { number: 2, title: "SQL", topics: ["DDL and DML", "Joins and Subqueries", "Views and Indexes", "Stored Procedures and Triggers"], marks: 20 },
      { number: 3, title: "Normalization", topics: ["Functional Dependencies", "1NF, 2NF, 3NF", "BCNF", "Decomposition"], marks: 20 },
      { number: 4, title: "Transactions and Concurrency", topics: ["ACID Properties", "Concurrency Control Protocols", "Deadlock Handling", "Recovery Systems"], marks: 20 },
      { number: 5, title: "NoSQL and Advanced Topics", topics: ["Key-Value Stores", "Document Databases", "Graph Databases", "Distributed Databases"], marks: 20 }
    ]
  },
  {
    title: "Operating Systems",
    code: "24CST42",
    semester: 4, credits: 3, totalMarks: 100, department: "CSE",
    description: "Process management, memory management, file systems, and OS security.",
    units: [
      { number: 1, title: "Process Management", topics: ["Process States and PCB", "CPU Scheduling Algorithms", "Inter-process Communication", "Threads"], marks: 20 },
      { number: 2, title: "Process Synchronization", topics: ["Critical Section Problem", "Semaphores and Mutex", "Deadlock Detection", "Deadlock Prevention and Avoidance"], marks: 20 },
      { number: 3, title: "Memory Management", topics: ["Paging", "Segmentation", "Virtual Memory", "Page Replacement Algorithms"], marks: 20 },
      { number: 4, title: "File Systems", topics: ["File Organization", "Directory Structure", "Disk Scheduling", "File Allocation Methods"], marks: 20 },
      { number: 5, title: "I/O and Security", topics: ["I/O Hardware and Software", "Kernel I/O Subsystem", "Access Control", "User Authentication"], marks: 20 }
    ]
  },
  {
    title: "Design and Analysis of Algorithms",
    code: "24CST43",
    semester: 4, credits: 3, totalMarks: 100, department: "CSE",
    description: "Algorithm design paradigms — divide-and-conquer, greedy, DP, backtracking, and complexity analysis.",
    units: [
      { number: 1, title: "Algorithm Fundamentals", topics: ["Asymptotic Notations", "Time and Space Complexity", "Recurrence Relations", "Master Theorem"], marks: 20 },
      { number: 2, title: "Divide and Conquer", topics: ["Merge Sort", "Quick Sort", "Binary Search", "Strassen's Matrix Multiplication"], marks: 20 },
      { number: 3, title: "Greedy Algorithms", topics: ["Activity Selection", "Huffman Coding", "Kruskal's and Prim's MST", "Dijkstra's Shortest Path"], marks: 20 },
      { number: 4, title: "Dynamic Programming", topics: ["0/1 Knapsack", "Longest Common Subsequence", "Matrix Chain Multiplication", "Floyd-Warshall Algorithm"], marks: 20 },
      { number: 5, title: "Backtracking and NP-Completeness", topics: ["N-Queens Problem", "Graph Colouring", "NP, NP-Hard, NP-Complete", "Approximation Algorithms"], marks: 20 }
    ]
  }
];
