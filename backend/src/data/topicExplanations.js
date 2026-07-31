module.exports = {
  // C Programming Fundamentals
  "Data Types and Variables": {
    summary: `
      <div style="font-family: Arial, sans-serif;">
        <h3 style="color: var(--accent);">The Building Blocks of Memory</h3>
        <p>Think of a <strong>Variable</strong> as a labeled box where you can store information. The <strong>Data Type</strong> tells the computer what kind of information fits in that box.</p>
        <img src="https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=800" alt="Boxes representing variables" style="width:100%; border-radius:12px; margin: 1rem 0;" />
        <p>Just like you wouldn't put soup in a cardboard box, you shouldn't put text in an integer variable. The compiler needs to know exactly how much memory to allocate.</p>
        <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <pre><code style="color: #66d9ef;">int</code> <span style="color: #a6e22e;">userAge</span> = <span style="color: #ae81ff;">25</span>;
<code style="color: #66d9ef;">float</code> <span style="color: #a6e22e;">accountBalance</span> = <span style="color: #ae81ff;">1500.50</span>;
<code style="color: #66d9ef;">char</code> <span style="color: #a6e22e;">grade</span> = <span style="color: #e6db74;">'A'</span>;</pre>
        </div>
      </div>
    `,
    keyPoints: [
      "Variables must be 'declared' before use so the computer knows to save space.",
      "Common types: int (integers), float (decimals), char (characters).",
      "Variable names should be descriptive (e.g., 'userAge' instead of 'x')."
    ]
  },
  "Arrays": {
    summary: `
      <div style="font-family: Arial, sans-serif;">
        <h3 style="color: var(--accent);">Organizing Data in Sequences</h3>
        <p>An <strong>Array</strong> is a collection of items of the same type stored together in contiguous memory locations. It's like a row of lockers, where each locker has a unique number (an index).</p>
        <img src="https://images.unsplash.com/photo-1544390977-1d6f35b62b1b?auto=format&fit=crop&q=80&w=800" alt="Lockers representing an array" style="width:100%; border-radius:12px; margin: 1rem 0;" />
        <p>Arrays are incredibly fast for looking up data if you know the exact index, but they are rigid—you must define their size when you create them.</p>
        <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <pre><code style="color: #66d9ef;">int</code> <span style="color: #a6e22e;">scores</span>[<span style="color: #ae81ff;">5</span>] = {<span style="color: #ae81ff;">90</span>, <span style="color: #ae81ff;">85</span>, <span style="color: #ae81ff;">78</span>, <span style="color: #ae81ff;">92</span>, <span style="color: #ae81ff;">88</span>};
<span style="color: #75715e;">// Access the first score</span>
<code style="color: #66d9ef;">int</code> <span style="color: #a6e22e;">first</span> = <span style="color: #a6e22e;">scores</span>[<span style="color: #ae81ff;">0</span>];</pre>
        </div>
      </div>
    `,
    keyPoints: [
      "Array indices always start at 0.",
      "They store elements of the EXACT same data type.",
      "Accessing an array out of its bounds can cause segmentation faults."
    ]
  },
  "Linked Lists": {
    summary: `
      <div style="font-family: Arial, sans-serif;">
        <h3 style="color: var(--accent);">Dynamic Data Chains</h3>
        <p>Unlike an array, a <strong>Linked List</strong> does not store elements in contiguous memory. Instead, each element (called a <strong>Node</strong>) points to the next one in the sequence, like a treasure hunt.</p>
        <img src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=800" alt="Chains representing linked links" style="width:100%; border-radius:12px; margin: 1rem 0;" />
        <p>This means you can easily add or remove elements without shifting everything else, but finding the 5th element requires following the chain from the beginning.</p>
        <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <pre><code style="color: #66d9ef;">struct</code> <span style="color: #a6e22e;">Node</span> {
    <code style="color: #66d9ef;">int</code> <span style="color: #a6e22e;">data</span>;
    <code style="color: #66d9ef;">struct</code> Node* <span style="color: #a6e22e;">next</span>;
};</pre>
        </div>
      </div>
    `,
    keyPoints: [
      "Nodes contain data and a pointer to the next node.",
      "Insertion and deletion are fast (O(1) if you have the pointer).",
      "Random access is slow (O(N) to find the Nth element)."
    ]
  },
  "Conditional Statements": {
    summary: `
      <div style="font-family: Arial, sans-serif;">
        <h3 style="color: var(--accent);">Making Decisions in Code</h3>
        <p><strong>Conditional Statements</strong> allow your program to make decisions. If a certain condition is true, the program does one thing; if not, it does something else.</p>
        <p>Think of it like a fork in a road. If the path to the left is clear, you go left. Otherwise, you go right.</p>
      </div>
    `,
    keyPoints: [
      "The 'if' statement checks a single condition.",
      "The 'else' statement provides a fallback if the condition is false.",
      "The 'switch' statement is great for choosing between many specific options."
    ]
  }
};
