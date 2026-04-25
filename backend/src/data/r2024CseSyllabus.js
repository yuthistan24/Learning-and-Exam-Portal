module.exports = [
  {
    title: "Data Structures",
    code: "24CSC31",
    semester: 3,
    credits: 3,
    totalMarks: 100,
    description: "Study of fundamental data structures and their applications.",
    units: [
      { number: 1, title: "Introduction and Linear Data Structures", topics: ["Abstract Data Types", "Arrays", "Linked Lists", "Stacks", "Queues"] },
      { number: 2, title: "Tree Structures", topics: ["Binary Trees", "Binary Search Trees", "AVL Trees", "Heaps"] },
      { number: 3, title: "Graph Structures", topics: ["Representation", "BFS", "DFS", "Shortest Path Algorithms"] },
      { number: 4, title: "Sorting and Searching", topics: ["Internal Sorting", "External Sorting", "Hashing Techniques"] },
      { number: 5, title: "Advanced Data Structures", topics: ["Tries", "B-Trees", "Splay Trees", "Red-Black Trees"] }
    ]
  },
  {
    title: "Operating Systems",
    code: "24CSC41",
    semester: 4,
    credits: 3,
    totalMarks: 100,
    description: "Concepts of operating system design and implementation.",
    units: [
      { number: 1, title: "Process Management", topics: ["Process States", "CPU Scheduling", "Inter-process Communication"] },
      { number: 2, title: "Memory Management", topics: ["Paging", "Segmentation", "Virtual Memory", "Page Replacement"] },
      { number: 3, title: "Storage and File Systems", topics: ["Disk Scheduling", "File Allocation", "Directory Structure"] },
      { number: 4, title: "I/O Systems and Security", topics: ["I/O Hardware", "Kernel I/O Subsystem", "Access Matrix", "User Authentication"] },
      { number: 5, title: "Distributed Systems and Cloud", topics: ["Network Structure", "Distributed File Systems", "Cloud OS Concepts"] }
    ]
  },
  {
    title: "Database Management Systems",
    code: "24CSC42",
    semester: 4,
    credits: 3,
    totalMarks: 100,
    description: "Design and use of relational databases.",
    units: [
      { number: 1, title: "Relational Model", topics: ["ER Diagrams", "Relational Algebra", "Normalization (1NF, 2NF, 3NF)"] },
      { number: 2, title: "SQL", topics: ["DDL", "DML", "DCL", "Joins", "Subqueries"] },
      { number: 3, title: "Transactions", topics: ["ACID Properties", "Concurrency Control", "Recovery Systems"] },
      { number: 4, title: "NoSQL and Advanced SQL", topics: ["Key-Value Stores", "Document Databases", "Graph Databases", "Stored Procedures"] },
      { number: 5, title: "Distributed and Real-time Databases", topics: ["Parallel Databases", "Distributed Data Storage", "Mobile Databases"] }
    ]
  }
];
